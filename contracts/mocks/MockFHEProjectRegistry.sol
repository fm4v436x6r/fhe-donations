// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MockFHEProjectRegistry
 * @notice Mock version of FHEProjectRegistry for local testing without Zama coprocessor
 */
contract MockFHEProjectRegistry is Ownable, ReentrancyGuard, Pausable {
    struct Project {
        uint256 id;
        address owner;
        string metadataURI;
        bool isActive;
        bool isVerified;
        uint256 createdAt;
    }

    uint256 public projectCount;
    mapping(uint256 => Project) public projects;
    mapping(address => uint256[]) public ownerProjects;
    mapping(address => bytes32) public userCredentials;
    mapping(bytes32 => address) public credentialToUser;

    address public credentialVerifier;
    bool public credentialRequired;

    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string metadataURI);
    event ProjectUpdated(uint256 indexed projectId, string newMetadataURI);
    event ProjectVerified(uint256 indexed projectId, bool isVerified);
    event ProjectDeactivated(uint256 indexed projectId);
    event CredentialUpdated(address indexed user, bytes32 credentialHash);
    event CredentialVerifierSet(address indexed verifier);

    constructor() Ownable(msg.sender) {}

    function registerProject(string memory metadataURI) external whenNotPaused nonReentrant returns (uint256) {
        require(bytes(metadataURI).length > 0, "Empty metadata URI");

        projectCount++;
        projects[projectCount] = Project({
            id: projectCount,
            owner: msg.sender,
            metadataURI: metadataURI,
            isActive: true,
            isVerified: false,
            createdAt: block.timestamp
        });
        ownerProjects[msg.sender].push(projectCount);

        emit ProjectRegistered(projectCount, msg.sender, metadataURI);
        return projectCount;
    }

    function updateProjectMetadata(uint256 projectId, string memory newMetadataURI) external {
        require(projectId > 0 && projectId <= projectCount, "Project does not exist");
        require(projects[projectId].owner == msg.sender, "Not project owner");
        require(projects[projectId].isActive, "Project is inactive");

        projects[projectId].metadataURI = newMetadataURI;
        emit ProjectUpdated(projectId, newMetadataURI);
    }

    function verifyProject(uint256 projectId, bool verified) external onlyOwner {
        require(projectId > 0 && projectId <= projectCount, "Project does not exist");
        projects[projectId].isVerified = verified;
        emit ProjectVerified(projectId, verified);
    }

    function batchVerifyProjects(uint256[] calldata projectIds, bool[] calldata verifiedStates) external onlyOwner {
        require(projectIds.length == verifiedStates.length, "Array length mismatch");
        for (uint256 i = 0; i < projectIds.length; i++) {
            require(projectIds[i] > 0 && projectIds[i] <= projectCount, "Project does not exist");
            projects[projectIds[i]].isVerified = verifiedStates[i];
            emit ProjectVerified(projectIds[i], verifiedStates[i]);
        }
    }

    function deactivateProject(uint256 projectId) external {
        require(projectId > 0 && projectId <= projectCount, "Project does not exist");
        require(projects[projectId].owner == msg.sender || msg.sender == owner(), "Not authorized");
        projects[projectId].isActive = false;
        emit ProjectDeactivated(projectId);
    }

    function updateCredential(bytes32 credentialHash) external {
        require(credentialHash != bytes32(0), "Invalid credential hash");

        bytes32 oldCredential = userCredentials[msg.sender];
        if (oldCredential != bytes32(0)) {
            delete credentialToUser[oldCredential];
        }

        require(credentialToUser[credentialHash] == address(0), "Credential already used");

        userCredentials[msg.sender] = credentialHash;
        credentialToUser[credentialHash] = msg.sender;
        emit CredentialUpdated(msg.sender, credentialHash);
    }

    function verifyCredential(address user) external view returns (bool) {
        if (!credentialRequired) return true;
        return userCredentials[user] != bytes32(0);
    }

    function setCredentialVerifier(address verifier) external onlyOwner {
        credentialVerifier = verifier;
        emit CredentialVerifierSet(verifier);
    }

    function setCredentialRequirement(bool required) external onlyOwner {
        credentialRequired = required;
    }

    function getProject(uint256 projectId) external view returns (Project memory) {
        require(projectId > 0 && projectId <= projectCount, "Project does not exist");
        return projects[projectId];
    }

    function getOwnerProjects(address projectOwner) external view returns (uint256[] memory) {
        return ownerProjects[projectOwner];
    }

    function getActiveProjectCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= projectCount; i++) {
            if (projects[i].isActive) count++;
        }
        return count;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
