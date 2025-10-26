// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FHEDonationBase.sol";
import "./interfaces/IFHEDonation.sol";

/**
 * @title FHEProjectRegistry
 * @notice Manages project registration, verification, and metadata
 * @dev Handles project lifecycle and anti-sybil credential management
 */
contract FHEProjectRegistry is FHEDonationBase {
    // State variables
    uint256 public nextProjectId;
    mapping(uint256 => IFHEDonation.Project) public projects;
    mapping(address => uint256[]) public ownerProjects;
    mapping(address => bytes32) public userCredentials;
    mapping(bytes32 => bool) public usedCredentials;
    
    // Anti-sybil configuration
    address public credentialVerifier;
    uint256 public minCredentialScore;
    bool public requireCredentials;
    
    // Events
    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string metadataURI);
    event ProjectUpdated(uint256 indexed projectId, string metadataURI);
    event ProjectVerified(uint256 indexed projectId, bool verified);
    event ProjectDeactivated(uint256 indexed projectId);
    event CredentialUpdated(address indexed user, bytes32 credentialHash);
    event CredentialVerifierSet(address indexed verifier);
    
    // Modifiers
    modifier onlyProjectOwner(uint256 projectId) {
        require(projects[projectId].owner == msg.sender, "Not project owner");
        _;
    }
    
    modifier projectExists(uint256 projectId) {
        require(projects[projectId].createdAt != 0, "Project does not exist");
        _;
    }
    
    modifier validCredential(address user) {
        if (requireCredentials) {
            require(verifyCredential(user), "Invalid credential");
        }
        _;
    }
    
    constructor() {
        nextProjectId = 1;
        requireCredentials = false;
        minCredentialScore = 50; // Default minimum score
    }
    
    /**
     * @notice Register a new project
     * @param metadataURI IPFS URI containing project metadata
     * @return projectId The ID of the newly registered project
     */
    function registerProject(string calldata metadataURI) 
        external 
        whenNotPaused
        validCredential(msg.sender)
        returns (uint256 projectId) 
    {
        require(bytes(metadataURI).length > 0, "Empty metadata URI");
        
        projectId = nextProjectId++;
        
        IFHEDonation.Project storage project = projects[projectId];
        project.id = projectId;
        project.owner = msg.sender;
        project.metadataURI = metadataURI;
        project.isActive = true;
        project.isVerified = false;
        project.createdAt = block.timestamp;
        
        if (requireCredentials) {
            project.credentialHash = userCredentials[msg.sender];
        }
        
        ownerProjects[msg.sender].push(projectId);
        
        emit ProjectRegistered(projectId, msg.sender, metadataURI);
    }
    
    /**
     * @notice Update project metadata
     * @param projectId The project to update
     * @param metadataURI New metadata URI
     */
    function updateProjectMetadata(uint256 projectId, string calldata metadataURI)
        external
        whenNotPaused
        projectExists(projectId)
        onlyProjectOwner(projectId)
    {
        require(bytes(metadataURI).length > 0, "Empty metadata URI");
        require(projects[projectId].isActive, "Project is inactive");
        
        projects[projectId].metadataURI = metadataURI;
        
        emit ProjectUpdated(projectId, metadataURI);
    }
    
    /**
     * @notice Verify or unverify a project (admin only)
     * @param projectId The project to verify
     * @param verified Verification status
     */
    function verifyProject(uint256 projectId, bool verified)
        external
        onlyOwner
        projectExists(projectId)
    {
        projects[projectId].isVerified = verified;
        emit ProjectVerified(projectId, verified);
    }
    
    /**
     * @notice Deactivate a project
     * @param projectId The project to deactivate
     */
    function deactivateProject(uint256 projectId)
        external
        projectExists(projectId)
    {
        require(
            msg.sender == projects[projectId].owner || msg.sender == owner(),
            "Not authorized"
        );
        
        projects[projectId].isActive = false;
        emit ProjectDeactivated(projectId);
    }
    
    /**
     * @notice Update user credential for anti-sybil protection
     * @param credentialHash Hash of credential data (e.g., Gitcoin Passport)
     */
    function updateCredential(bytes32 credentialHash) external whenNotPaused {
        require(credentialHash != bytes32(0), "Invalid credential hash");
        require(!usedCredentials[credentialHash], "Credential already used");
        
        // Mark old credential as unused if exists
        if (userCredentials[msg.sender] != bytes32(0)) {
            usedCredentials[userCredentials[msg.sender]] = false;
        }
        
        userCredentials[msg.sender] = credentialHash;
        usedCredentials[credentialHash] = true;
        
        emit CredentialUpdated(msg.sender, credentialHash);
    }
    
    /**
     * @notice Verify user credential
     * @param user Address to verify
     * @return Boolean indicating if credential is valid
     */
    function verifyCredential(address user) public view returns (bool) {
        if (!requireCredentials) {
            return true;
        }
        
        bytes32 credential = userCredentials[user];
        if (credential == bytes32(0)) {
            return false;
        }
        
        // In production, this would call an external verifier contract
        // For now, we check if credential exists and is marked as used
        return usedCredentials[credential];
    }
    
    /**
     * @notice Set credential verifier contract
     * @param verifier Address of verifier contract
     */
    function setCredentialVerifier(address verifier) external onlyOwner {
        credentialVerifier = verifier;
        emit CredentialVerifierSet(verifier);
    }
    
    /**
     * @notice Enable or disable credential requirement
     * @param required Whether credentials are required
     */
    function setCredentialRequirement(bool required) external onlyOwner {
        requireCredentials = required;
    }
    
    /**
     * @notice Set minimum credential score
     * @param score Minimum score required
     */
    function setMinCredentialScore(uint256 score) external onlyOwner {
        minCredentialScore = score;
    }
    
    /**
     * @notice Get project details
     * @param projectId The project ID
     * @return owner Project owner address
     * @return metadataURI Metadata URI
     * @return isActive Active status
     * @return isVerified Verification status
     * @return createdAt Creation timestamp
     */
    function getProject(uint256 projectId)
        external
        view
        projectExists(projectId)
        returns (
            address owner,
            string memory metadataURI,
            bool isActive,
            bool isVerified,
            uint256 createdAt
        )
    {
        IFHEDonation.Project storage project = projects[projectId];
        return (
            project.owner,
            project.metadataURI,
            project.isActive,
            project.isVerified,
            project.createdAt
        );
    }
    
    /**
     * @notice Get all projects owned by an address
     * @param owner The owner address
     * @return Array of project IDs
     */
    function getOwnerProjects(address owner) external view returns (uint256[] memory) {
        return ownerProjects[owner];
    }
    
    /**
     * @notice Get active project count
     * @return count Number of active projects
     */
    function getActiveProjectCount() external view returns (uint256 count) {
        for (uint256 i = 1; i < nextProjectId; i++) {
            if (projects[i].isActive) {
                count++;
            }
        }
    }
    
    /**
     * @notice Batch verify projects
     * @param projectIds Array of project IDs to verify
     * @param verified Verification status for each project
     */
    function batchVerifyProjects(
        uint256[] calldata projectIds,
        bool[] calldata verified
    ) external onlyOwner {
        require(projectIds.length == verified.length, "Array length mismatch");
        
        for (uint256 i = 0; i < projectIds.length; i++) {
            if (projects[projectIds[i]].createdAt != 0) {
                projects[projectIds[i]].isVerified = verified[i];
                emit ProjectVerified(projectIds[i], verified[i]);
            }
        }
    }
}