// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockFHEMatchingPool
 * @notice Mock version of FHEMatchingPool for local testing without Zama coprocessor
 */
contract MockFHEMatchingPool is Ownable, ReentrancyGuard, Pausable {
    struct PoolStats {
        uint256 totalContributors;
        uint256 totalAmount;
        uint256 distributedAmount;
    }

    struct StreamInfo {
        address sender;
        uint256 projectId;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
    }

    IERC20 public donationToken;
    uint256 public revealDelay;
    uint256 public claimDeadline;
    uint256 public minStreamDuration;
    uint256 public maxStreamDuration;

    uint256 public constant ONE_DAY = 86400;
    uint256 public constant ONE_WEEK = ONE_DAY * 7;

    mapping(uint256 => PoolStats) public poolStats; // roundId => stats
    mapping(uint256 => StreamInfo) public streams; // streamId => info
    uint256 public streamCount;

    event DonationTokenSet(address indexed token);
    event RevealDelaySet(uint256 delay);
    event ClaimDeadlineSet(uint256 deadline);

    constructor(address _donationToken) Ownable(msg.sender) {
        require(_donationToken != address(0), "Invalid token");
        donationToken = IERC20(_donationToken);
        revealDelay = ONE_WEEK;
        claimDeadline = ONE_DAY * 30;
        minStreamDuration = ONE_DAY;
        maxStreamDuration = ONE_DAY * 365;
    }

    function setDonationToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token");
        donationToken = IERC20(_token);
        emit DonationTokenSet(_token);
    }

    function setRevealDelay(uint256 _delay) external onlyOwner {
        require(_delay >= ONE_DAY, "Delay too short");
        revealDelay = _delay;
        emit RevealDelaySet(_delay);
    }

    function setClaimDeadline(uint256 _deadline) external onlyOwner {
        require(_deadline >= ONE_WEEK, "Deadline too short");
        claimDeadline = _deadline;
        emit ClaimDeadlineSet(_deadline);
    }

    function getPoolStats(uint256 roundId) external view returns (PoolStats memory) {
        return poolStats[roundId];
    }

    function getStreamInfo(uint256 streamId) external view returns (StreamInfo memory) {
        return streams[streamId];
    }

    function createStream(
        address sender,
        uint256 projectId,
        uint256 amount,
        uint256 duration
    ) external onlyOwner returns (uint256) {
        require(duration >= minStreamDuration, "Duration too short");
        require(duration <= maxStreamDuration, "Duration too long");

        streamCount++;
        streams[streamCount] = StreamInfo({
            sender: sender,
            projectId: projectId,
            amount: amount,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            isActive: true
        });

        return streamCount;
    }

    function batchUpdateStreams(uint256[] calldata streamIds) external {
        for (uint256 i = 0; i < streamIds.length; i++) {
            if (streams[streamIds[i]].isActive && block.timestamp >= streams[streamIds[i]].endTime) {
                streams[streamIds[i]].isActive = false;
            }
        }
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}
