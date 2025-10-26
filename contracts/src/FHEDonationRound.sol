// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FHEDonationBase.sol";
import {FHE, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {externalEuint32} from "encrypted-types/EncryptedTypes.sol";

/**
 * @title FHEDonationRound
 * @notice Manages donation rounds with encrypted donations and matching pools
 * @dev Handles round lifecycle, donation tracking, and matching calculations
 */
contract FHEDonationRound is FHEDonationBase {
    // Round structure
    struct Round {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        uint256 matchingPool; // Public matching pool amount (in Gwei)
        uint256 minDonation;
        uint256 maxDonation;
        bool isFinalized;
        uint256 totalProjects;
        uint256 totalDonors;
    }
    
    // Donation tracking structure
    struct DonationData {
        euint32 totalAmount;
        uint256 donorCount;
        bool hasMatching;
    }
    
    // State variables
    uint256 public nextRoundId;
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(uint256 => DonationData)) public projectDonations; // roundId => projectId => data
    mapping(uint256 => mapping(address => mapping(uint256 => euint32))) public donorContributions; // roundId => donor => projectId => amount
    mapping(uint256 => mapping(uint256 => euint32)) public projectMatching; // roundId => projectId => matching amount
    mapping(uint256 => uint256[]) public roundProjects; // roundId => projectIds
    mapping(uint256 => address[]) public roundDonors; // roundId => donor addresses
    
    // Configuration
    uint256 public matchingCapPercentage = 2000; // 20% cap per project
    uint256 public minProjectsForMatching = 3;
    
    // Events
    event RoundCreated(uint256 indexed roundId, string name, uint256 startTime, uint256 endTime);
    event MatchingPoolIncreased(uint256 indexed roundId, address indexed contributor);
    event DonationReceived(uint256 indexed roundId, uint256 indexed projectId, address indexed donor);
    event RoundFinalized(uint256 indexed roundId, uint256 timestamp);
    event MatchingCalculated(uint256 indexed roundId, uint256 projectsProcessed);
    
    // Modifiers
    modifier roundExists(uint256 roundId) {
        require(rounds[roundId].startTime != 0, "Round does not exist");
        _;
    }
    
    modifier roundActive(uint256 roundId) {
        require(block.timestamp >= rounds[roundId].startTime, "Round not started");
        require(block.timestamp <= rounds[roundId].endTime, "Round ended");
        require(!rounds[roundId].isFinalized, "Round finalized");
        _;
    }
    
    modifier roundEnded(uint256 roundId) {
        require(block.timestamp > rounds[roundId].endTime, "Round not ended");
        _;
    }
    
    constructor() {
        nextRoundId = 1;
    }
    
    /**
     * @notice Create a new funding round
     * @param name Round name
     * @param startTime Start timestamp
     * @param endTime End timestamp
     * @param matchingPoolAmount Initial matching pool amount (public, in Gwei)
     * @param minDonation Minimum donation amount
     * @param maxDonation Maximum donation amount per donor per project
     */
    function createRound(
        string calldata name,
        uint256 startTime,
        uint256 endTime,
        uint256 matchingPoolAmount,
        uint256 minDonation,
        uint256 maxDonation
    ) external whenNotPaused returns (uint256 roundId) {
        require(startTime > block.timestamp, "Invalid start time");
        require(endTime > startTime, "Invalid end time");
        require(maxDonation > minDonation, "Invalid donation limits");

        roundId = nextRoundId++;

        Round storage round = rounds[roundId];
        round.id = roundId;
        round.name = name;
        round.startTime = startTime;
        round.endTime = endTime;
        round.matchingPool = matchingPoolAmount;
        round.minDonation = minDonation;
        round.maxDonation = maxDonation;
        round.isFinalized = false;

        emit RoundCreated(roundId, name, startTime, endTime);
    }
    
    /**
     * @notice Add funds to matching pool
     * @param roundId Round ID
     * @param amount Amount to add (in Gwei)
     */
    function addToMatchingPool(
        uint256 roundId,
        uint256 amount
    ) external roundExists(roundId) whenNotPaused {
        require(!rounds[roundId].isFinalized, "Round finalized");
        require(amount > 0, "Amount must be > 0");

        rounds[roundId].matchingPool += amount;

        emit MatchingPoolIncreased(roundId, msg.sender);
    }
    
    /**
     * @notice Process a donation to a project
     * @param roundId Round ID
     * @param projectId Project ID
     * @param encryptedAmountHandle Encrypted donation amount handle (externalEuint32)
     * @param inputProof Proof of valid encryption
     */
    function processDonation(
        uint256 roundId,
        uint256 projectId,
        externalEuint32 encryptedAmountHandle,
        bytes calldata inputProof
    ) external roundActive(roundId) whenNotPaused nonReentrant {
        // Convert external handle to euint32 with proof verification
        euint32 amount = FHE.fromExternal(encryptedAmountHandle, inputProof);

        // Check if this is the first donation from this donor to this project
        euint32 existingDonation = donorContributions[roundId][msg.sender][projectId];
        ebool isFirstDonation = FHE.eq(existingDonation, FHE.asEuint32(0));

        // Update donor contribution
        euint32 newContribution = _safeAdd(existingDonation, amount);

        // Enforce max donation limit (encrypted comparison)
        euint32 maxDonationEncrypted = FHE.asEuint32(uint32(rounds[roundId].maxDonation));
        ebool exceedsMax = FHE.gt(newContribution, maxDonationEncrypted);
        newContribution = FHE.select(exceedsMax, maxDonationEncrypted, newContribution);

        // Calculate actual donation amount
        euint32 actualDonation = FHE.sub(newContribution, existingDonation);

        // Update state
        donorContributions[roundId][msg.sender][projectId] = newContribution;

        // Grant ACL permissions for the donor to view their own donation
        FHE.allow(newContribution, msg.sender);
        FHE.allowThis(actualDonation);

        // Update project totals
        DonationData storage data = projectDonations[roundId][projectId];
        data.totalAmount = _safeAdd(data.totalAmount, actualDonation);

        // Track new donor - use plaintext tracking instead of decryption
        // Store encrypted flag to check later via Gateway if needed
        if (data.donorCount == 0 || !_isDonorTracked(roundId, msg.sender, projectId)) {
            data.donorCount++;

            // Track project in round if first donation
            if (data.donorCount == 1) {
                roundProjects[roundId].push(projectId);
                rounds[roundId].totalProjects++;
            }

            // Track donor in round
            bool donorExists = false;
            address[] storage donors = roundDonors[roundId];
            for (uint i = 0; i < donors.length; i++) {
                if (donors[i] == msg.sender) {
                    donorExists = true;
                    break;
                }
            }
            if (!donorExists) {
                donors.push(msg.sender);
                rounds[roundId].totalDonors++;
            }
        }

        emit DonationReceived(roundId, projectId, msg.sender);
    }

    /**
     * @notice Check if donor is already tracked for project (plaintext tracking)
     * @param roundId Round ID
     * @param donor Donor address
     * @param projectId Project ID
     * @return True if donor is tracked
     */
    function _isDonorTracked(uint256 roundId, address donor, uint256 projectId) internal view returns (bool) {
        // Simple plaintext tracking using existing donation check
        // If existingDonation handle exists, donor is tracked
        euint32 existing = donorContributions[roundId][donor][projectId];
        // We cannot decrypt here, so we assume if the handle is non-zero, donor exists
        // This is a simplification - in production, maintain separate plaintext mapping
        return true; // Always increment for safety - will be refined with Gateway integration
    }
    
    /**
     * @notice Batch process multiple donations
     * @dev NOTE: Batch donations not supported with einput type
     * @dev Use multiple separate processDonation() calls instead
     * @param roundId Round ID
     * @param projectIds Array of project IDs
     * @param encryptedAmounts Array of encrypted amounts (not used - placeholder)
     * @param proofs Array of proofs (not used - placeholder)
     */
    function processDonationBatch(
        uint256 roundId,
        uint256[] calldata projectIds,
        bytes[] calldata encryptedAmounts,
        bytes[] calldata proofs
    ) external roundActive(roundId) whenNotPaused nonReentrant {
        revert("Batch donations not supported. Use individual processDonation() calls.");
        // Note: einput type cannot be passed in arrays
        // Users should call processDonation() multiple times in separate transactions
    }
    
    /**
     * @notice Calculate quadratic funding matching for a round
     * @param roundId Round ID
     */
    function calculateMatching(uint256 roundId) 
        external 
        roundExists(roundId)
        roundEnded(roundId)
        onlyOwner 
    {
        require(!rounds[roundId].isFinalized, "Already finalized");
        
        uint256[] storage projects = roundProjects[roundId];
        require(projects.length >= minProjectsForMatching, "Not enough projects");
        
        // Calculate sum of square roots of donations for each project
        euint32 totalSqrtSum = FHE.asEuint32(0);
        euint32[] memory projectSqrtSums = new euint32[](projects.length);
        
        for (uint i = 0; i < projects.length; i++) {
            uint256 projectId = projects[i];
            euint32 sqrtSum = _calculateProjectSqrtSum(roundId, projectId);
            projectSqrtSums[i] = sqrtSum;
            totalSqrtSum = _safeAdd(totalSqrtSum, sqrtSum);
        }
        
        // Distribute matching pool proportionally (now public)
        uint256 matchingPool = rounds[roundId].matchingPool;
        uint256 maxMatchingPerProject = (matchingPool * matchingCapPercentage) / 10000; // 20% cap
        
        // Simplified matching distribution: equal distribution among projects
        // TODO: Implement proper quadratic funding calculation using Gateway for decryption
        uint256 sharePerProject = matchingPool / projects.length;
        if (sharePerProject > maxMatchingPerProject) {
            sharePerProject = maxMatchingPerProject;
        }

        euint32 encryptedShare = FHE.asEuint32(uint32(sharePerProject));

        for (uint i = 0; i < projects.length; i++) {
            uint256 projectId = projects[i];
            projectMatching[roundId][projectId] = encryptedShare;
            projectDonations[roundId][projectId].hasMatching = true;
        }
        
        emit MatchingCalculated(roundId, projects.length);
    }
    
    /**
     * @notice Calculate sum of square roots of individual donations for a project
     * @param roundId Round ID
     * @param projectId Project ID
     * @return Sum of square roots
     * @dev Uses FHE conditional sum without decryption
     */
    function _calculateProjectSqrtSum(uint256 roundId, uint256 projectId)
        internal
        returns (euint32)
    {
        euint32 sqrtSum = FHE.asEuint32(0);
        address[] storage donors = roundDonors[roundId];

        for (uint i = 0; i < donors.length; i++) {
            euint32 donation = donorContributions[roundId][donors[i]][projectId];
            ebool hasDonated = FHE.gt(donation, FHE.asEuint32(0));

            // Calculate sqrt of donation
            euint32 sqrtDonation = _approxSqrt(donation);

            // Use cmux to add sqrt only if donor has donated (no decryption needed)
            euint32 toAdd = FHE.select(hasDonated, sqrtDonation, FHE.asEuint32(0));
            sqrtSum = _safeAdd(sqrtSum, toAdd);
        }

        return sqrtSum;
    }
    
    /**
     * @notice Finalize a round
     * @param roundId Round ID
     */
    function finalizeRound(uint256 roundId) 
        external 
        roundExists(roundId)
        roundEnded(roundId)
        onlyOwner 
    {
        require(!rounds[roundId].isFinalized, "Already finalized");
        
        rounds[roundId].isFinalized = true;
        emit RoundFinalized(roundId, block.timestamp);
    }
    
    /**
     * @notice Get round information
     * @param roundId Round ID
     */
    function getRoundInfo(uint256 roundId) 
        external 
        view 
        roundExists(roundId)
        returns (
            string memory name,
            uint256 startTime,
            uint256 endTime,
            uint256 minDonation,
            uint256 maxDonation,
            bool isFinalized,
            uint256 totalProjects,
            uint256 totalDonors
        )
    {
        Round storage round = rounds[roundId];
        return (
            round.name,
            round.startTime,
            round.endTime,
            round.minDonation,
            round.maxDonation,
            round.isFinalized,
            round.totalProjects,
            round.totalDonors
        );
    }
    
    /**
     * @notice Get encrypted donation amount
     * @param roundId Round ID
     * @param projectId Project ID
     * @param donor Donor address
     */
    function getEncryptedDonation(
        uint256 roundId,
        uint256 projectId,
        address donor
    ) external view returns (euint32) {
        return donorContributions[roundId][donor][projectId];
    }
    
    /**
     * @notice Get encrypted project total
     * @param roundId Round ID
     * @param projectId Project ID
     */
    function getEncryptedProjectTotal(
        uint256 roundId,
        uint256 projectId
    ) external view returns (euint32) {
        return projectDonations[roundId][projectId].totalAmount;
    }
    
    /**
     * @notice Get encrypted matching amount
     * @param roundId Round ID
     * @param projectId Project ID
     */
    function getEncryptedMatchingAmount(
        uint256 roundId,
        uint256 projectId
    ) external view returns (euint32) {
        return projectMatching[roundId][projectId];
    }
}