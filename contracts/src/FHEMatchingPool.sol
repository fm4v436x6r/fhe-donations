// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./FHEDonationBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {externalEuint32} from "encrypted-types/EncryptedTypes.sol";

/**
 * @title FHEMatchingPool
 * @notice Manages matching pool funds and distribution with privacy preservation
 * @dev Handles multiple funding sources, streaming donations, and controlled revelation
 */
contract FHEMatchingPool is FHEDonationBase {
    using SafeERC20 for IERC20;
    
    // Matching pool contributor structure
    struct Contributor {
        address addr;
        euint32 totalContribution;
        uint256 timestamp;
        bool isActive;
    }
    
    // Pool distribution structure
    struct Distribution {
        uint256 roundId;
        uint256 projectId;
        euint32 amount;
        address recipient;
        bool claimed;
        uint256 claimTime;
    }
    
    // Streaming donation structure
    struct Stream {
        address sender;
        uint256 projectId;
        euint32 ratePerSecond;
        uint256 startTime;
        uint256 endTime;
        euint32 totalStreamed;
        uint256 lastUpdate;
        bool isActive;
    }
    
    // State variables
    mapping(uint256 => Contributor[]) public roundContributors; // roundId => contributors
    mapping(uint256 => mapping(address => uint256)) public contributorIndex; // roundId => address => index
    mapping(uint256 => euint32) public totalPoolSize; // roundId => total encrypted pool
    mapping(uint256 => mapping(uint256 => Distribution)) public distributions; // roundId => projectId => distribution
    mapping(uint256 => Stream) public streams; // streamId => stream data
    uint256 public nextStreamId;
    
    // Token management
    IERC20 public donationToken;
    mapping(address => euint32) public encryptedBalances;
    
    // Configuration
    uint256 public revealDelay = 7 days; // Delay before amounts can be revealed
    uint256 public claimDeadline = 30 days; // Deadline to claim matching funds
    uint256 public minStreamDuration = 1 days;
    uint256 public maxStreamDuration = 365 days;

    // Events
    event PoolContribution(uint256 indexed roundId, address indexed contributor, uint256 timestamp);
    event DistributionCreated(uint256 indexed roundId, uint256 indexed projectId, address recipient);
    event MatchingClaimed(uint256 indexed roundId, uint256 indexed projectId, address indexed recipient);
    event StreamCreated(uint256 indexed streamId, address indexed sender, uint256 indexed projectId);
    event StreamUpdated(uint256 indexed streamId, uint256 totalStreamed);
    event StreamCancelled(uint256 indexed streamId);
    event RevealRequested(uint256 indexed roundId, uint256 indexed projectId, address requester);
    
    // Modifiers
    modifier validToken() {
        require(address(donationToken) != address(0), "Token not set");
        _;
    }
    
    constructor(address _donationToken) {
        donationToken = IERC20(_donationToken);
        nextStreamId = 1;
    }
    
    /**
     * @notice Contribute to matching pool
     * @param roundId Round ID
     * @param encryptedAmountHandle Encrypted contribution amount handle (externalEuint32)
     * @param inputProof Proof of valid encryption
     */
    function contributeToPool(
        uint256 roundId,
        externalEuint32 encryptedAmountHandle,
        bytes calldata inputProof
    ) external validToken whenNotPaused nonReentrant {
        euint32 amount = FHE.fromExternal(encryptedAmountHandle, inputProof);
        
        // Check if contributor exists
        uint256 index = contributorIndex[roundId][msg.sender];
        if (index == 0) {
            // New contributor
            Contributor memory newContributor = Contributor({
                addr: msg.sender,
                totalContribution: amount,
                timestamp: block.timestamp,
                isActive: true
            });
            roundContributors[roundId].push(newContributor);
            contributorIndex[roundId][msg.sender] = roundContributors[roundId].length;
        } else {
            // Existing contributor
            Contributor storage contributor = roundContributors[roundId][index - 1];
            contributor.totalContribution = _safeAdd(contributor.totalContribution, amount);
        }
        
        // Update total pool size
        totalPoolSize[roundId] = _safeAdd(totalPoolSize[roundId], amount);
        
        // Update encrypted balance
        encryptedBalances[msg.sender] = _safeAdd(encryptedBalances[msg.sender], amount);
        
        emit PoolContribution(roundId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Create a streaming donation
     * @param projectId Project to stream to
     * @param encryptedRateHandle Encrypted rate per second handle
     * @param inputProof Proof of valid encryption
     * @param duration Stream duration in seconds
     */
    function createStream(
        uint256 projectId,
        externalEuint32 encryptedRateHandle,
        bytes calldata inputProof,
        uint256 duration
    ) external validToken whenNotPaused nonReentrant returns (uint256 streamId) {
        require(duration >= minStreamDuration, "Duration too short");
        require(duration <= maxStreamDuration, "Duration too long");

        streamId = nextStreamId++;
        euint32 rate = FHE.fromExternal(encryptedRateHandle, inputProof);

        Stream storage stream = streams[streamId];
        stream.sender = msg.sender;
        stream.projectId = projectId;
        stream.ratePerSecond = rate;
        stream.startTime = block.timestamp;
        stream.endTime = block.timestamp + duration;
        stream.totalStreamed = FHE.asEuint32(0);
        stream.lastUpdate = block.timestamp;
        stream.isActive = true;
        
        emit StreamCreated(streamId, msg.sender, projectId);
    }
    
    /**
     * @notice Update stream and calculate streamed amount
     * @param streamId Stream ID
     */
    function updateStream(uint256 streamId) public whenNotPaused {
        Stream storage stream = streams[streamId];
        require(stream.isActive, "Stream not active");
        
        uint256 currentTime = block.timestamp;
        if (currentTime > stream.endTime) {
            currentTime = stream.endTime;
        }
        
        uint256 elapsed = currentTime - stream.lastUpdate;
        if (elapsed > 0) {
            euint32 streamedAmount = _safeMul(
                stream.ratePerSecond,
                FHE.asEuint32(uint32(elapsed))
            );
            stream.totalStreamed = _safeAdd(stream.totalStreamed, streamedAmount);
            stream.lastUpdate = currentTime;
            
            // Check if stream is complete
            if (currentTime >= stream.endTime) {
                stream.isActive = false;
            }

            // Grant ACL permission for stream sender to view their streamed amount
            FHE.allow(stream.totalStreamed, stream.sender);

            // Do NOT emit decrypted value - emit streamId only for privacy
            emit StreamUpdated(streamId, 0); // Changed: removed decryption
        }
    }
    
    /**
     * @notice Cancel a stream
     * @param streamId Stream ID
     */
    function cancelStream(uint256 streamId) external whenNotPaused {
        Stream storage stream = streams[streamId];
        require(stream.sender == msg.sender, "Not stream owner");
        require(stream.isActive, "Stream not active");
        
        // Update stream to current time
        updateStream(streamId);
        
        // Mark as inactive
        stream.isActive = false;
        stream.endTime = block.timestamp;
        
        emit StreamCancelled(streamId);
    }
    
    /**
     * @notice Create distribution record for a project
     * @param roundId Round ID
     * @param projectId Project ID
     * @param encryptedAmountHandle Encrypted matching amount handle
     * @param inputProof Proof of valid encryption
     * @param recipient Recipient address
     */
    function createDistribution(
        uint256 roundId,
        uint256 projectId,
        externalEuint32 encryptedAmountHandle,
        bytes calldata inputProof,
        address recipient
    ) external onlyOwner whenNotPaused {
        require(recipient != address(0), "Invalid recipient");
        require(!distributions[roundId][projectId].claimed, "Already distributed");

        euint32 amount = FHE.fromExternal(encryptedAmountHandle, inputProof);
        
        distributions[roundId][projectId] = Distribution({
            roundId: roundId,
            projectId: projectId,
            amount: amount,
            recipient: recipient,
            claimed: false,
            claimTime: 0
        });
        
        emit DistributionCreated(roundId, projectId, recipient);
    }
    
    /**
     * @notice Claim matching funds for a project
     * @param roundId Round ID
     * @param projectId Project ID
     * @param decryptedAmount The decrypted matching amount (provided off-chain via Gateway)
     * @dev In v0.8.0, Gateway decryption happens off-chain. Amount must be verified.
     */
    function claimMatching(
        uint256 roundId,
        uint256 projectId,
        uint32 decryptedAmount
    )
        external
        validToken
        whenNotPaused
        nonReentrant
    {
        Distribution storage dist = distributions[roundId][projectId];
        require(dist.recipient == msg.sender, "Not recipient");
        require(!dist.claimed, "Already claimed");
        require(block.timestamp <= dist.claimTime + claimDeadline, "Claim expired");

        // TODO: Add signature verification for decrypted amount from Gateway
        // For now, we trust the provided amount (this should be verified in production)

        // Mark as claimed
        dist.claimed = true;
        dist.claimTime = block.timestamp;

        // Transfer actual tokens to recipient
        if (decryptedAmount > 0) {
            donationToken.safeTransfer(msg.sender, decryptedAmount);
        }

        emit MatchingClaimed(roundId, projectId, msg.sender);
    }
    
    /**
     * @notice Request controlled revelation of amount
     * @param roundId Round ID
     * @param projectId Project ID
     */
    function requestReveal(uint256 roundId, uint256 projectId) external {
        Distribution storage dist = distributions[roundId][projectId];
        require(dist.recipient == msg.sender, "Not authorized");
        require(block.timestamp >= dist.claimTime + revealDelay, "Reveal delay not met");
        
        // Grant reencryption permission
        bytes32 dataId = keccak256(abi.encodePacked(roundId, projectId));
        _grantReencryptionPermission(msg.sender, dataId);
        
        emit RevealRequested(roundId, projectId, msg.sender);
    }
    
    /**
     * @notice Get pool statistics for a round
     * @param roundId Round ID
     * @return totalContributors Number of contributors
     * @return poolSize Encrypted total pool size
     */
    function getPoolStats(uint256 roundId) 
        external 
        view 
        returns (uint256 totalContributors, euint32 poolSize) 
    {
        totalContributors = roundContributors[roundId].length;
        poolSize = totalPoolSize[roundId];
    }
    
    /**
     * @notice Get stream information
     * @param streamId Stream ID
     */
    function getStreamInfo(uint256 streamId) 
        external 
        view 
        returns (
            address sender,
            uint256 projectId,
            uint256 startTime,
            uint256 endTime,
            bool isActive
        )
    {
        Stream storage stream = streams[streamId];
        return (
            stream.sender,
            stream.projectId,
            stream.startTime,
            stream.endTime,
            stream.isActive
        );
    }
    
    /**
     * @notice Batch update multiple streams
     * @param streamIds Array of stream IDs to update
     */
    function batchUpdateStreams(uint256[] calldata streamIds) external {
        for (uint256 i = 0; i < streamIds.length; i++) {
            if (streams[streamIds[i]].isActive) {
                updateStream(streamIds[i]);
            }
        }
    }
    
    /**
     * @notice Set donation token
     * @param _token Token address
     */
    function setDonationToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token");
        donationToken = IERC20(_token);
    }
    
    /**
     * @notice Set reveal delay
     * @param _delay Delay in seconds
     */
    function setRevealDelay(uint256 _delay) external onlyOwner {
        require(_delay >= 1 days, "Delay too short");
        revealDelay = _delay;
    }
    
    /**
     * @notice Set claim deadline
     * @param _deadline Deadline in seconds
     */
    function setClaimDeadline(uint256 _deadline) external onlyOwner {
        require(_deadline >= 7 days, "Deadline too short");
        claimDeadline = _deadline;
    }
    
    /**
     * @notice Emergency withdrawal
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
}