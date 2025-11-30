// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MockFHEProjectRegistry.sol";
import "./MockFHEDonationRound.sol";
import "./MockFHEMatchingPool.sol";

/**
 * @title MockFHEQuadraticFunding
 * @notice Mock version of FHEQuadraticFunding for local testing without Zama coprocessor
 */
contract MockFHEQuadraticFunding is Ownable, ReentrancyGuard, Pausable {
    MockFHEProjectRegistry public projectRegistry;
    MockFHEDonationRound public donationRound;
    MockFHEMatchingPool public matchingPool;

    address public feeRecipient;
    uint256 public platformFeePercentage; // In basis points (100 = 1%)
    uint256 public minDonorsForMatching;
    uint256 public donationCooldown;

    mapping(address => uint256) public lastDonationTime;
    mapping(address => uint256[]) public donorReceipts;

    uint256 public constant MAX_FEE = 1000; // 10%
    uint256 public constant ONE_HOUR = 3600;

    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string metadataURI);
    event ProjectVerified(uint256 indexed projectId, bool isVerified);
    event RoundCreated(uint256 indexed roundId);
    event RoundFinalized(uint256 indexed roundId);
    event CredentialUpdated(address indexed user, bytes32 credentialHash);

    constructor(
        address _projectRegistry,
        address _donationRound,
        address payable _matchingPool,
        address _feeRecipient
    ) Ownable(msg.sender) {
        require(_projectRegistry != address(0), "Invalid registry");
        require(_donationRound != address(0), "Invalid round");
        require(_matchingPool != address(0), "Invalid pool");
        require(_feeRecipient != address(0), "Invalid recipient");

        projectRegistry = MockFHEProjectRegistry(_projectRegistry);
        donationRound = MockFHEDonationRound(_donationRound);
        matchingPool = MockFHEMatchingPool(_matchingPool);
        feeRecipient = _feeRecipient;

        platformFeePercentage = 250; // 2.5%
        minDonorsForMatching = 5;
        donationCooldown = 60; // 1 minute
    }

    // Project Management
    function registerProject(string memory metadataURI) external whenNotPaused returns (uint256) {
        uint256 projectId = projectRegistry.registerProject(metadataURI);
        emit ProjectRegistered(projectId, msg.sender, metadataURI);
        return projectId;
    }

    function verifyProject(uint256 projectId, bool verified) external onlyOwner {
        projectRegistry.verifyProject(projectId, verified);
        emit ProjectVerified(projectId, verified);
    }

    function updateProjectMetadata(uint256 projectId, string memory newMetadataURI) external {
        projectRegistry.updateProjectMetadata(projectId, newMetadataURI);
    }

    function deactivateProject(uint256 projectId) external {
        projectRegistry.deactivateProject(projectId);
    }

    function getProject(uint256 projectId) external view returns (MockFHEProjectRegistry.Project memory) {
        return projectRegistry.getProject(projectId);
    }

    // Round Management
    function createRound(
        string memory name,
        uint256 startTime,
        uint256 endTime,
        uint256 matchingPoolAmount,
        uint256 minDonation,
        uint256 maxDonation
    ) external onlyOwner whenNotPaused returns (uint256) {
        uint256 roundId = donationRound.createRound(
            name,
            startTime,
            endTime,
            matchingPoolAmount,
            minDonation,
            maxDonation
        );
        emit RoundCreated(roundId);
        return roundId;
    }

    function addToMatchingPool(uint256 roundId, uint256 amount) external {
        donationRound.addToMatchingPool(roundId, amount);
    }

    function finalizeRound(uint256 roundId) external onlyOwner {
        donationRound.finalizeRound(roundId);
        emit RoundFinalized(roundId);
    }

    function getRoundInfo(uint256 roundId) external view returns (MockFHEDonationRound.Round memory) {
        return donationRound.getRoundInfo(roundId);
    }

    // Credential Management
    function updateCredential(bytes32 credentialHash) external {
        projectRegistry.updateCredential(credentialHash);
        emit CredentialUpdated(msg.sender, credentialHash);
    }

    function verifyCredential(address user) external view returns (bool) {
        return projectRegistry.verifyCredential(user);
    }

    function setCredentialVerifier(address verifier) external onlyOwner {
        projectRegistry.setCredentialVerifier(verifier);
    }

    // Configuration
    function setPlatformFee(uint256 fee) external onlyOwner {
        require(fee <= MAX_FEE, "Fee too high");
        platformFeePercentage = fee;
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        feeRecipient = recipient;
    }

    function setDonationCooldown(uint256 cooldown) external onlyOwner {
        require(cooldown <= ONE_HOUR, "Cooldown too long");
        donationCooldown = cooldown;
    }

    function setMinDonorsForMatching(uint256 minDonors) external onlyOwner {
        minDonorsForMatching = minDonors;
    }

    function updateContracts(
        address _registry,
        address _round,
        address payable _pool
    ) external onlyOwner {
        if (_registry != address(0)) {
            projectRegistry = MockFHEProjectRegistry(_registry);
        }
        if (_round != address(0)) {
            donationRound = MockFHEDonationRound(_round);
        }
        if (_pool != address(0)) {
            matchingPool = MockFHEMatchingPool(_pool);
        }
    }

    // Receipt Management
    function getDonorReceipts(address donor) external view returns (uint256[] memory) {
        return donorReceipts[donor];
    }

    // Batch Donations
    function donateBatch(
        uint256 roundId,
        uint256[] calldata projectIds,
        bytes[] calldata encryptedAmounts,
        bytes[] calldata proofs
    ) external pure {
        // Not supported in mock
        revert("Batch donations not supported. Use individual donate() calls.");
    }

    // Emergency Functions
    function withdrawEmergency(address token, uint256 amount) external onlyOwner {
        matchingPool.emergencyWithdraw(token, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
