// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FHEDonationBase.sol";
import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title FHEDonationRound
 * @notice Manages donation rounds with ENCRYPTED PROJECT SELECTION
 * @dev Privacy model: Donation amounts are public (ETH transfers), but which project
 *      receives each donation is encrypted. This prevents:
 *      - Vote buying / bribery (can't verify who voted for whom)
 *      - Social pressure (can't see others' choices)
 *      - Strategic voting based on others' selections
 */
contract FHEDonationRound is FHEDonationBase {
    // Round structure
    struct Round {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        uint256 matchingPool; // Public matching pool amount (in wei)
        uint256 minDonation;  // Minimum donation in wei
        uint256 maxDonation;  // Maximum donation in wei
        bool isFinalized;
        uint256 totalProjects;
        uint256 totalDonations; // Total donation count
    }

    // Encrypted donation - stores which project received the donation
    struct EncryptedDonation {
        address donor;
        uint256 amount;        // Public ETH amount
        euint32 encryptedProjectId;  // ENCRYPTED: which project
        uint256 timestamp;
    }

    // Project donation tracking (encrypted totals)
    struct ProjectData {
        euint32 encryptedTotal;  // Encrypted sum of donations
        euint32 encryptedDonorCount; // Encrypted donor count
        bool isRegistered;
    }

    // State variables
    uint256 public nextRoundId;
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => EncryptedDonation[]) public roundDonations; // roundId => donations
    mapping(uint256 => mapping(uint256 => ProjectData)) public projectData; // roundId => projectId => data
    mapping(uint256 => uint256[]) public roundProjects; // roundId => registered projectIds
    mapping(uint256 => mapping(address => uint256)) public donorTotalAmount; // roundId => donor => total donated

    // Configuration
    uint256 public matchingCapPercentage = 2000; // 20% cap per project
    uint256 public minProjectsForMatching = 2;
    uint256 public maxProjectId = 1000; // Maximum project ID for validation

    // Events - Note: projectId is NOT emitted to preserve privacy
    event RoundCreated(uint256 indexed roundId, string name, uint256 startTime, uint256 endTime);
    event MatchingPoolIncreased(uint256 indexed roundId, address indexed contributor, uint256 amount);
    event DonationReceived(uint256 indexed roundId, address indexed donor, uint256 amount); // No projectId!
    event ProjectRegistered(uint256 indexed roundId, uint256 indexed projectId);
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
     * @param minDonation Minimum donation amount (in wei)
     * @param maxDonation Maximum donation amount per transaction (in wei)
     */
    function createRound(
        string calldata name,
        uint256 startTime,
        uint256 endTime,
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
        round.minDonation = minDonation;
        round.maxDonation = maxDonation;
        round.isFinalized = false;

        emit RoundCreated(roundId, name, startTime, endTime);
    }

    /**
     * @notice Register a project for a round
     * @param roundId Round ID
     * @param projectId Project ID to register
     */
    function registerProject(
        uint256 roundId,
        uint256 projectId
    ) external roundExists(roundId) whenNotPaused {
        require(!rounds[roundId].isFinalized, "Round finalized");
        require(projectId > 0 && projectId <= maxProjectId, "Invalid project ID");
        require(!projectData[roundId][projectId].isRegistered, "Already registered");

        projectData[roundId][projectId].isRegistered = true;
        projectData[roundId][projectId].encryptedTotal = FHE.asEuint32(0);
        projectData[roundId][projectId].encryptedDonorCount = FHE.asEuint32(0);

        roundProjects[roundId].push(projectId);
        rounds[roundId].totalProjects++;

        emit ProjectRegistered(roundId, projectId);
    }

    /**
     * @notice Add funds to matching pool
     * @param roundId Round ID
     */
    function addToMatchingPool(
        uint256 roundId
    ) external payable roundExists(roundId) whenNotPaused {
        require(!rounds[roundId].isFinalized, "Round finalized");
        require(msg.value > 0, "Amount must be > 0");

        rounds[roundId].matchingPool += msg.value;

        emit MatchingPoolIncreased(roundId, msg.sender, msg.value);
    }

    /**
     * @notice Donate to a project with ENCRYPTED project selection
     * @dev The projectId is encrypted - no one knows which project you're supporting!
     * @param roundId Round ID
     * @param encryptedProjectId Encrypted project ID (externalEuint32)
     * @param inputProof Proof of valid encryption
     */
    function donate(
        uint256 roundId,
        externalEuint32 encryptedProjectId,
        bytes calldata inputProof
    ) external payable roundActive(roundId) whenNotPaused nonReentrant {
        require(msg.value >= rounds[roundId].minDonation, "Below minimum donation");
        require(msg.value <= rounds[roundId].maxDonation, "Above maximum donation");

        // Convert external encrypted projectId to internal euint32
        euint32 projectId = FHE.fromExternal(encryptedProjectId, inputProof);

        // Store encrypted donation
        roundDonations[roundId].push(EncryptedDonation({
            donor: msg.sender,
            amount: msg.value,
            encryptedProjectId: projectId,
            timestamp: block.timestamp
        }));

        // Track donor's total (public)
        donorTotalAmount[roundId][msg.sender] += msg.value;
        rounds[roundId].totalDonations++;

        // Grant ACL permission for donor to view their own encrypted projectId
        FHE.allow(projectId, msg.sender);

        // Emit event WITHOUT projectId to preserve privacy
        emit DonationReceived(roundId, msg.sender, msg.value);
    }

    /**
     * @notice Calculate and distribute donations to projects
     * @dev This processes encrypted project selections and updates project totals
     * @param roundId Round ID
     */
    function tallyDonations(uint256 roundId)
        external
        roundExists(roundId)
        roundEnded(roundId)
        onlyOwner
    {
        require(!rounds[roundId].isFinalized, "Already finalized");

        EncryptedDonation[] storage donations = roundDonations[roundId];
        uint256[] storage projects = roundProjects[roundId];

        // For each donation, add to the matching project's total using FHE.select
        for (uint256 i = 0; i < donations.length; i++) {
            euint32 donationAmount = FHE.asEuint32(uint32(donations[i].amount / 1e9)); // Convert to Gwei for euint32
            euint32 encryptedProjId = donations[i].encryptedProjectId;

            // For each registered project, check if it matches and add conditionally
            for (uint256 j = 0; j < projects.length; j++) {
                uint256 projId = projects[j];
                euint32 projIdEncrypted = FHE.asEuint32(uint32(projId));

                // Check if this donation is for this project (encrypted comparison)
                ebool isMatch = FHE.eq(encryptedProjId, projIdEncrypted);

                // Conditionally add donation amount
                euint32 toAdd = FHE.select(isMatch, donationAmount, FHE.asEuint32(0));
                projectData[roundId][projId].encryptedTotal = _safeAdd(
                    projectData[roundId][projId].encryptedTotal,
                    toAdd
                );

                // Conditionally increment donor count
                euint32 oneOrZero = FHE.select(isMatch, FHE.asEuint32(1), FHE.asEuint32(0));
                projectData[roundId][projId].encryptedDonorCount = _safeAdd(
                    projectData[roundId][projId].encryptedDonorCount,
                    oneOrZero
                );
            }
        }

        emit MatchingCalculated(roundId, projects.length);
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
            uint256 matchingPool,
            uint256 minDonation,
            uint256 maxDonation,
            bool isFinalized,
            uint256 totalProjects,
            uint256 totalDonations
        )
    {
        Round storage round = rounds[roundId];
        return (
            round.name,
            round.startTime,
            round.endTime,
            round.matchingPool,
            round.minDonation,
            round.maxDonation,
            round.isFinalized,
            round.totalProjects,
            round.totalDonations
        );
    }

    /**
     * @notice Get registered projects for a round
     * @param roundId Round ID
     */
    function getRoundProjects(uint256 roundId)
        external
        view
        returns (uint256[] memory)
    {
        return roundProjects[roundId];
    }

    /**
     * @notice Get donation count for a round
     * @param roundId Round ID
     */
    function getDonationCount(uint256 roundId)
        external
        view
        returns (uint256)
    {
        return roundDonations[roundId].length;
    }

    /**
     * @notice Get donor's total donated amount (public)
     * @param roundId Round ID
     * @param donor Donor address
     */
    function getDonorTotal(uint256 roundId, address donor)
        external
        view
        returns (uint256)
    {
        return donorTotalAmount[roundId][donor];
    }

    /**
     * @notice Get encrypted project total (only revealed after round ends)
     * @param roundId Round ID
     * @param projectId Project ID
     */
    function getEncryptedProjectTotal(
        uint256 roundId,
        uint256 projectId
    ) external view returns (euint32) {
        return projectData[roundId][projectId].encryptedTotal;
    }

    /**
     * @notice Get encrypted donor count for project
     * @param roundId Round ID
     * @param projectId Project ID
     */
    function getEncryptedDonorCount(
        uint256 roundId,
        uint256 projectId
    ) external view returns (euint32) {
        return projectData[roundId][projectId].encryptedDonorCount;
    }

    /**
     * @notice Withdraw matching pool funds (only owner, only after finalized)
     * @param roundId Round ID
     * @param to Recipient address
     */
    function withdrawMatchingPool(uint256 roundId, address payable to)
        external
        onlyOwner
    {
        require(rounds[roundId].isFinalized, "Round not finalized");
        uint256 amount = rounds[roundId].matchingPool;
        require(amount > 0, "No funds to withdraw");

        rounds[roundId].matchingPool = 0;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Set max project ID for validation
     * @param _maxProjectId New maximum project ID
     */
    function setMaxProjectId(uint256 _maxProjectId) external onlyOwner {
        maxProjectId = _maxProjectId;
    }

    // Receive ETH for matching pool
    receive() external payable {}
}
