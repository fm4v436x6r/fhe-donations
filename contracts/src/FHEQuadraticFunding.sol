// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FHEDonationBase.sol";
import "./FHEProjectRegistry.sol";
import "./FHEDonationRound.sol";
import "./FHEMatchingPool.sol";
import "./interfaces/IFHEDonation.sol";
import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {externalEuint32} from "encrypted-types/EncryptedTypes.sol";

/**
 * @title FHEQuadraticFunding
 * @notice Main contract orchestrating FHE-enabled quadratic funding rounds
 * @dev Integrates project registry, rounds, and matching pools with privacy preservation
 */
contract FHEQuadraticFunding is FHEDonationBase, IFHEDonation {
    // Contract references
    FHEProjectRegistry public projectRegistry;
    FHEDonationRound public donationRound;
    FHEMatchingPool public matchingPool;
    
    // Donation receipt tracking
    mapping(bytes32 => DonationReceipt) public receipts;
    mapping(address => bytes32[]) public donorReceipts;
    uint256 public nextReceiptId;
    
    // Round participation tracking
    mapping(uint256 => mapping(address => bool)) public hasParticipated; // roundId => donor => participated
    mapping(uint256 => uint256) public roundParticipants; // roundId => participant count
    
    // Configuration
    uint256 public platformFeePercentage = 250; // 2.5% platform fee
    address public feeRecipient;
    uint256 public minDonorsForMatching = 5; // Minimum unique donors for QF
    
    // Anti-gaming measures
    mapping(address => uint256) public lastDonationTime;
    uint256 public donationCooldown = 1 minutes; // Cooldown between donations
    
    constructor(
        address _projectRegistry,
        address _donationRound,
        address _matchingPool,
        address _feeRecipient
    ) {
        projectRegistry = FHEProjectRegistry(_projectRegistry);
        donationRound = FHEDonationRound(_donationRound);
        matchingPool = FHEMatchingPool(_matchingPool);
        feeRecipient = _feeRecipient;
        nextReceiptId = 1;
    }
    
    /**
     * @notice Register a new project (delegates to registry)
     */
    function registerProject(string calldata metadataURI) 
        external 
        override 
        whenNotPaused 
        returns (uint256 projectId) 
    {
        projectId = projectRegistry.registerProject(metadataURI);
        emit ProjectRegistered(projectId, msg.sender, metadataURI);
    }
    
    /**
     * @notice Update project metadata
     */
    function updateProjectMetadata(uint256 projectId, string calldata metadataURI) 
        external 
        override 
        whenNotPaused 
    {
        projectRegistry.updateProjectMetadata(projectId, metadataURI);
    }
    
    /**
     * @notice Verify a project (admin only)
     */
    function verifyProject(uint256 projectId, bool verified) 
        external 
        override 
        onlyOwner 
    {
        projectRegistry.verifyProject(projectId, verified);
        emit ProjectVerified(projectId, verified);
    }
    
    /**
     * @notice Deactivate a project
     */
    function deactivateProject(uint256 projectId) external override whenNotPaused {
        projectRegistry.deactivateProject(projectId);
    }
    
    /**
     * @notice Create a new funding round
     */
    function createRound(
        string calldata name,
        uint256 startTime,
        uint256 endTime,
        externalEuint32 encryptedMatchingPoolHandle,
        bytes calldata inputProof,
        uint256 minDonation,
        uint256 maxDonation
    ) external override onlyOwner whenNotPaused returns (uint256 roundId) {
        roundId = donationRound.createRound(
            name,
            startTime,
            endTime,
            encryptedMatchingPoolHandle,
            inputProof,
            minDonation,
            maxDonation
        );

        // Initialize matching pool for this round
        matchingPool.contributeToPool(roundId, encryptedMatchingPoolHandle, inputProof);
        
        emit RoundCreated(roundId, name, startTime, endTime);
    }
    
    /**
     * @notice Add funds to matching pool
     */
    function addToMatchingPool(
        uint256 roundId,
        externalEuint32 encryptedAmountHandle,
        bytes calldata inputProof
    ) external override whenNotPaused {
        donationRound.addToMatchingPool(roundId, encryptedAmountHandle, inputProof);
        matchingPool.contributeToPool(roundId, encryptedAmountHandle, inputProof);
    }

    /**
     * @notice Make a donation to a project
     */
    function donate(
        uint256 roundId,
        uint256 projectId,
        externalEuint32 encryptedAmountHandle,
        bytes calldata inputProof
    ) external override whenNotPaused nonReentrant {
        // Cooldown check
        require(
            block.timestamp >= lastDonationTime[msg.sender] + donationCooldown,
            "Donation cooldown active"
        );

        // Verify project is active and verified
        (address owner, , bool isActive, bool isVerified, ) = projectRegistry.getProject(projectId);
        require(isActive, "Project not active");
        require(isVerified, "Project not verified");

        // Verify donor credentials if required
        require(projectRegistry.verifyCredential(msg.sender), "Invalid credentials");

        // Process donation
        donationRound.processDonation(roundId, projectId, encryptedAmountHandle, inputProof);

        // Track participation
        if (!hasParticipated[roundId][msg.sender]) {
            hasParticipated[roundId][msg.sender] = true;
            roundParticipants[roundId]++;
        }

        // Create receipt (convert external handle to euint32 for storage)
        _createReceipt(roundId, projectId, encryptedAmountHandle, inputProof);
        
        // Update cooldown
        lastDonationTime[msg.sender] = block.timestamp;
        
        emit DonationMade(roundId, projectId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Batch donation to multiple projects
     */
    function donateBatch(
        uint256 roundId,
        uint256[] calldata projectIds,
        bytes[] calldata encryptedAmounts,
        bytes[] calldata proofs
    ) external override whenNotPaused nonReentrant {
        revert("Batch donations not supported. Use individual donate() calls.");
        // Note: externalEuint32 type cannot be passed in arrays
    }
    
    /**
     * @notice Calculate quadratic funding matching
     */
    function calculateMatching(uint256 roundId) external override onlyOwner {
        // Verify minimum participants
        require(roundParticipants[roundId] >= minDonorsForMatching, "Not enough participants");
        
        // Delegate to round contract
        donationRound.calculateMatching(roundId);
        
        emit MatchingDistributed(roundId, 0);
    }
    
    /**
     * @notice Finalize a funding round
     */
    function finalizeRound(uint256 roundId) external override onlyOwner {
        donationRound.finalizeRound(roundId);
        
        // Distribute matching amounts to projects
        _distributeMatching(roundId);
        
        emit RoundFinalized(roundId, block.timestamp);
    }
    
    /**
     * @notice Claim matching funds for a project
     * @dev In v0.8.0, decryption happens off-chain via Gateway. Amount must be provided.
     */
    function claimMatching(uint256 roundId, uint256 projectId) external override whenNotPaused {
        (address projectOwner, , , , ) = projectRegistry.getProject(projectId);
        require(projectOwner == msg.sender, "Not project owner");

        // TODO: In production, get decrypted amount via Gateway off-chain
        // For now, placeholder with 0 (requires Gateway integration)
        uint32 decryptedAmount = 0;
        matchingPool.claimMatching(roundId, projectId, decryptedAmount);

        emit MatchingDistributed(roundId, projectId);
    }
    
    /**
     * @notice Get project information
     */
    function getProject(uint256 projectId) 
        external 
        view 
        override 
        returns (
            address owner,
            string memory metadataURI,
            bool isActive,
            bool isVerified,
            uint256 createdAt
        )
    {
        return projectRegistry.getProject(projectId);
    }
    
    /**
     * @notice Get round information
     */
    function getRoundInfo(uint256 roundId) 
        external 
        view 
        override 
        returns (
            string memory name,
            uint256 startTime,
            uint256 endTime,
            uint256 minDonation,
            uint256 maxDonation,
            bool isFinalized
        )
    {
        (name, startTime, endTime, minDonation, maxDonation, isFinalized, , ) = 
            donationRound.getRoundInfo(roundId);
        return (name, startTime, endTime, minDonation, maxDonation, isFinalized);
    }
    
    /**
     * @notice Get encrypted donation amount
     */
    function getEncryptedDonation(
        uint256 roundId,
        uint256 projectId,
        address donor
    ) external view override returns (euint32) {
        return donationRound.getEncryptedDonation(roundId, projectId, donor);
    }
    
    /**
     * @notice Get encrypted project total
     */
    function getEncryptedProjectTotal(
        uint256 roundId,
        uint256 projectId
    ) external view override returns (euint32) {
        return donationRound.getEncryptedProjectTotal(roundId, projectId);
    }
    
    /**
     * @notice Get encrypted matching amount
     */
    function getEncryptedMatchingAmount(
        uint256 roundId,
        uint256 projectId
    ) external view override returns (euint32) {
        return donationRound.getEncryptedMatchingAmount(roundId, projectId);
    }
    
    /**
     * @notice Update user credential
     */
    function updateCredential(bytes32 credentialHash) external override whenNotPaused {
        projectRegistry.updateCredential(credentialHash);
        emit CredentialUpdated(msg.sender, credentialHash);
    }
    
    /**
     * @notice Verify user credential
     */
    function verifyCredential(address user) external view override returns (bool) {
        return projectRegistry.verifyCredential(user);
    }
    
    /**
     * @notice Set credential verifier
     */
    function setCredentialVerifier(address verifier) external override onlyOwner {
        projectRegistry.setCredentialVerifier(verifier);
    }
    
    /**
     * @notice Emergency withdrawal
     */
    function withdrawEmergency(address token, uint256 amount) external override onlyOwner {
        matchingPool.emergencyWithdraw(token, amount);
    }
    
    /**
     * @notice Create donation receipt
     */
    function _createReceipt(
        uint256 roundId,
        uint256 projectId,
        externalEuint32 encryptedAmountHandle,
        bytes memory inputProof
    ) internal {
        bytes32 receiptId = keccak256(
            abi.encodePacked(nextReceiptId++, msg.sender, roundId, projectId)
        );

        receipts[receiptId] = DonationReceipt({
            roundId: roundId,
            projectId: projectId,
            donor: msg.sender,
            amount: FHE.fromExternal(encryptedAmountHandle, inputProof),
            timestamp: block.timestamp
        });

        donorReceipts[msg.sender].push(receiptId);
    }
    
    /**
     * @notice Distribute matching funds to projects
     * @dev Creates distributions WITHOUT decryption - uses encrypted amounts
     */
    function _distributeMatching(uint256 roundId) internal {
        // Get round info to identify projects
        (string memory name, , , , , , uint256 totalProjects, ) =
            donationRound.getRoundInfo(roundId);

        // This would iterate through projects and create distributions
        // Simplified for gas efficiency
        for (uint256 i = 1; i <= totalProjects; i++) {
            euint32 matchingAmount = donationRound.getEncryptedMatchingAmount(roundId, i);

            // Grant ACL permission for contract and project owner to view matching
            (address projectOwner, , , , ) = projectRegistry.getProject(i);
            FHE.allow(matchingAmount, address(matchingPool));
            FHE.allow(matchingAmount, projectOwner);

            // Create distribution with ENCRYPTED amount (not decrypted!)
            // NOTE: Cannot call createDistribution here because it requires externalEuint32 type
            // In production, this should use a different flow:
            // 1. Store encrypted matching amounts in FHEDonationRound
            // 2. Project owners request Gateway decryption
            // 3. After decryption callback, create distribution with plaintext amount
            // For now, skip distribution creation here
            // Projects can claim directly from FHEDonationRound using stored encrypted amounts
        }
    }
    
    /**
     * @notice Get donor receipts
     */
    function getDonorReceipts(address donor) external view returns (bytes32[] memory) {
        return donorReceipts[donor];
    }
    
    /**
     * @notice Get receipt details
     */
    function getReceipt(bytes32 receiptId) 
        external 
        view 
        returns (
            uint256 roundId,
            uint256 projectId,
            address donor,
            uint256 timestamp
        )
    {
        DonationReceipt storage receipt = receipts[receiptId];
        return (receipt.roundId, receipt.projectId, receipt.donor, receipt.timestamp);
    }
    
    /**
     * @notice Set platform fee
     */
    function setPlatformFee(uint256 feePercentage) external onlyOwner {
        require(feePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = feePercentage;
    }
    
    /**
     * @notice Set fee recipient
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid recipient");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @notice Set donation cooldown
     */
    function setDonationCooldown(uint256 cooldown) external onlyOwner {
        require(cooldown <= 1 hours, "Cooldown too long");
        donationCooldown = cooldown;
    }
    
    /**
     * @notice Update contract references
     */
    function updateContracts(
        address _projectRegistry,
        address _donationRound,
        address _matchingPool
    ) external onlyOwner {
        if (_projectRegistry != address(0)) {
            projectRegistry = FHEProjectRegistry(_projectRegistry);
        }
        if (_donationRound != address(0)) {
            donationRound = FHEDonationRound(_donationRound);
        }
        if (_matchingPool != address(0)) {
            matchingPool = FHEMatchingPool(_matchingPool);
        }
    }
}