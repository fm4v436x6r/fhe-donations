// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint32} from "@fhevm/solidity/lib/FHE.sol";
import {externalEuint32} from "encrypted-types/EncryptedTypes.sol";

/**
 * @title IFHEDonation
 * @notice Interface for FHE-enabled donation platform with quadratic funding
 * @dev Defines the core functions for private donations and matching pool distribution
 */
interface IFHEDonation {
    // Structs
    struct Project {
        uint256 id;
        address owner;
        string metadataURI;
        bool isActive;
        bool isVerified;
        uint256 createdAt;
        bytes32 credentialHash;
    }

    struct Round {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        euint32 matchingPool; // Encrypted matching pool amount
        uint256 minDonation;
        uint256 maxDonation;
        bool isFinalized;
        mapping(uint256 => euint32) projectDonations; // projectId => encrypted total donations
        mapping(uint256 => euint32) projectMatching; // projectId => encrypted matching amount
        mapping(address => mapping(uint256 => euint32)) donorContributions; // donor => projectId => encrypted amount
    }

    struct DonationReceipt {
        uint256 roundId;
        uint256 projectId;
        address donor;
        euint32 amount; // Encrypted donation amount
        uint256 timestamp;
    }

    // Events
    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string metadataURI);
    event ProjectVerified(uint256 indexed projectId, bool verified);
    event RoundCreated(uint256 indexed roundId, string name, uint256 startTime, uint256 endTime);
    event DonationMade(uint256 indexed roundId, uint256 indexed projectId, address indexed donor, uint256 timestamp);
    event RoundFinalized(uint256 indexed roundId, uint256 timestamp);
    event MatchingDistributed(uint256 indexed roundId, uint256 indexed projectId);
    event CredentialUpdated(address indexed user, bytes32 credentialHash);

    // Project Management
    function registerProject(string calldata metadataURI) external returns (uint256 projectId);
    function updateProjectMetadata(uint256 projectId, string calldata metadataURI) external;
    function verifyProject(uint256 projectId, bool verified) external;
    function deactivateProject(uint256 projectId) external;

    // Round Management
    function createRound(
        string calldata name,
        uint256 startTime,
        uint256 endTime,
        externalEuint32 encryptedMatchingPoolHandle,
        bytes calldata inputProof,
        uint256 minDonation,
        uint256 maxDonation
    ) external returns (uint256 roundId);

    function addToMatchingPool(
        uint256 roundId,
        externalEuint32 encryptedAmountHandle,
        bytes calldata inputProof
    ) external;

    // Donation Functions
    function donate(
        uint256 roundId,
        uint256 projectId,
        externalEuint32 encryptedAmountHandle,
        bytes calldata inputProof
    ) external;
    
    function donateBatch(
        uint256 roundId,
        uint256[] calldata projectIds,
        bytes[] calldata encryptedAmounts,
        bytes[] calldata proofs
    ) external;
    
    // Quadratic Funding Calculations
    function calculateMatching(uint256 roundId) external;
    function finalizeRound(uint256 roundId) external;
    function claimMatching(uint256 roundId, uint256 projectId) external;
    
    // View Functions
    function getProject(uint256 projectId) external view returns (
        address owner,
        string memory metadataURI,
        bool isActive,
        bool isVerified,
        uint256 createdAt
    );
    
    function getRoundInfo(uint256 roundId) external view returns (
        string memory name,
        uint256 startTime,
        uint256 endTime,
        uint256 minDonation,
        uint256 maxDonation,
        bool isFinalized
    );
    
    function getEncryptedDonation(
        uint256 roundId,
        uint256 projectId,
        address donor
    ) external view returns (euint32);
    
    function getEncryptedProjectTotal(
        uint256 roundId,
        uint256 projectId
    ) external view returns (euint32);
    
    function getEncryptedMatchingAmount(
        uint256 roundId,
        uint256 projectId
    ) external view returns (euint32);
    
    // Anti-Sybil Functions
    function updateCredential(bytes32 credentialHash) external;
    function verifyCredential(address user) external view returns (bool);
    function setCredentialVerifier(address verifier) external;
    
    // Admin Functions
    // Note: pause/unpause inherited from Pausable contract, removed from interface to avoid conflicts
    function withdrawEmergency(address token, uint256 amount) external;
}