// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FHEDonationBase.sol";
import "./FHEProjectRegistry.sol";
import "./FHEDonationRound.sol";
import "./FHEMatchingPool.sol";
import "./interfaces/IFHEDonation.sol";
import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title FHEQuadraticFunding
 * @notice Main contract orchestrating FHE-enabled quadratic funding rounds
 * @dev Privacy model: Project selection is encrypted, donation amounts are public (ETH transfers)
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
        address payable _donationRound,  // Now payable
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
     * @notice Create a new funding round (anyone can create)
     * @dev New signature: no matchingPoolAmount param, use addToMatchingPool separately
     */
    function createRound(
        string calldata name,
        uint256 startTime,
        uint256 endTime,
        uint256 /* matchingPoolAmount - ignored, use addToMatchingPool */,
        uint256 minDonation,
        uint256 maxDonation
    ) external override whenNotPaused returns (uint256 roundId) {
        roundId = donationRound.createRound(
            name,
            startTime,
            endTime,
            minDonation,
            maxDonation
        );

        emit RoundCreated(roundId, name, startTime, endTime);
    }

    /**
     * @notice Add funds to matching pool (send ETH)
     */
    function addToMatchingPool(
        uint256 roundId,
        uint256 /* amount - ignored, use msg.value */
    ) external payable override whenNotPaused {
        donationRound.addToMatchingPool{value: msg.value}(roundId);
    }

    /**
     * @notice Make a donation with ENCRYPTED project selection
     * @dev New privacy model: project ID is encrypted, amount is public (ETH transfer)
     */
    function donate(
        uint256 roundId,
        uint256 projectId,  // This is for verification only - actual selection is encrypted
        externalEuint32 encryptedProjectId,  // Encrypted project ID
        bytes calldata inputProof
    ) external payable override whenNotPaused nonReentrant {
        // Cooldown check
        require(
            block.timestamp >= lastDonationTime[msg.sender] + donationCooldown,
            "Donation cooldown active"
        );

        // Verify project is active (plaintext check for validation)
        (address owner, , bool isActive, , ) = projectRegistry.getProject(projectId);
        require(isActive, "Project not active");

        // Verify donor credentials if required
        require(projectRegistry.verifyCredential(msg.sender), "Invalid credentials");

        // Process donation with encrypted project ID
        donationRound.donate{value: msg.value}(roundId, encryptedProjectId, inputProof);

        // Track participation
        if (!hasParticipated[roundId][msg.sender]) {
            hasParticipated[roundId][msg.sender] = true;
            roundParticipants[roundId]++;
        }

        // Update cooldown
        lastDonationTime[msg.sender] = block.timestamp;

        // Note: projectId in event is the plaintext one user selected
        // but actual encrypted selection may differ (privacy feature)
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
    }

    /**
     * @notice Tally donations after round ends
     */
    function tallyDonations(uint256 roundId) external onlyOwner {
        donationRound.tallyDonations(roundId);
    }

    /**
     * @notice Calculate quadratic funding matching (deprecated - use tallyDonations)
     */
    function calculateMatching(uint256 roundId) external override onlyOwner {
        // Verify minimum participants
        require(roundParticipants[roundId] >= minDonorsForMatching, "Not enough participants");

        // Delegate to round contract
        donationRound.tallyDonations(roundId);

        emit MatchingDistributed(roundId, 0);
    }

    /**
     * @notice Finalize a funding round
     */
    function finalizeRound(uint256 roundId) external override onlyOwner {
        donationRound.finalizeRound(roundId);
        emit RoundFinalized(roundId, block.timestamp);
    }

    /**
     * @notice Claim matching funds for a project
     */
    function claimMatching(uint256 roundId, uint256 projectId) external override whenNotPaused {
        (address projectOwner, , , , ) = projectRegistry.getProject(projectId);
        require(projectOwner == msg.sender, "Not project owner");

        // Get encrypted matching amount
        euint32 matchingAmount = donationRound.getEncryptedProjectTotal(roundId, projectId);

        // Make it publicly decryptable using v0.9.1 API
        FHE.makePubliclyDecryptable(matchingAmount);

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
        (name, startTime, endTime, , minDonation, maxDonation, isFinalized, , ) =
            donationRound.getRoundInfo(roundId);
        return (name, startTime, endTime, minDonation, maxDonation, isFinalized);
    }

    /**
     * @notice Get encrypted donation amount (deprecated - amounts are now public)
     */
    function getEncryptedDonation(
        uint256 /* roundId */,
        uint256 /* projectId */,
        address /* donor */
    ) external pure override returns (euint32) {
        // Return zero handle - individual donations no longer tracked by project
        // Note: returns empty euint32 (null handle)
        euint32 zero;
        return zero;
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
     * @notice Get encrypted matching amount (same as project total in new model)
     */
    function getEncryptedMatchingAmount(
        uint256 roundId,
        uint256 projectId
    ) external view override returns (euint32) {
        return donationRound.getEncryptedProjectTotal(roundId, projectId);
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
        address payable _donationRound,
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

    // Receive ETH
    receive() external payable {}
}
