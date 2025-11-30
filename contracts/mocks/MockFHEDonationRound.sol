// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MockFHEDonationRound
 * @notice Mock version of FHEDonationRound for local testing without Zama coprocessor
 */
contract MockFHEDonationRound is Ownable, ReentrancyGuard, Pausable {
    struct Round {
        uint256 id;
        string name;
        uint256 startTime;
        uint256 endTime;
        uint256 matchingPool;
        uint256 minDonation;
        uint256 maxDonation;
        bool isFinalized;
        uint256 totalProjects;
        uint256 totalDonors;
    }

    uint256 public roundCount;
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(uint256 => bool)) public roundProjects; // roundId => projectId => registered
    mapping(uint256 => mapping(address => bool)) public roundDonors; // roundId => donor => hasDonated

    event RoundCreated(uint256 indexed roundId, string name, uint256 startTime, uint256 endTime);
    event MatchingPoolIncreased(uint256 indexed roundId, address indexed contributor);
    event RoundFinalized(uint256 indexed roundId);

    constructor() Ownable(msg.sender) {}

    function createRound(
        string memory name,
        uint256 startTime,
        uint256 endTime,
        uint256 matchingPool,
        uint256 minDonation,
        uint256 maxDonation
    ) external whenNotPaused onlyOwner returns (uint256) {
        require(startTime > block.timestamp, "Invalid start time");
        require(endTime > startTime, "Invalid end time");
        require(maxDonation > minDonation, "Invalid donation limits");

        roundCount++;
        rounds[roundCount] = Round({
            id: roundCount,
            name: name,
            startTime: startTime,
            endTime: endTime,
            matchingPool: matchingPool,
            minDonation: minDonation,
            maxDonation: maxDonation,
            isFinalized: false,
            totalProjects: 0,
            totalDonors: 0
        });

        emit RoundCreated(roundCount, name, startTime, endTime);
        return roundCount;
    }

    function addToMatchingPool(uint256 roundId, uint256 amount) external {
        require(roundId > 0 && roundId <= roundCount, "Round does not exist");
        require(!rounds[roundId].isFinalized, "Round finalized");
        require(amount > 0, "Amount must be > 0");

        rounds[roundId].matchingPool += amount;
        emit MatchingPoolIncreased(roundId, msg.sender);
    }

    function finalizeRound(uint256 roundId) external onlyOwner {
        require(roundId > 0 && roundId <= roundCount, "Round does not exist");
        require(!rounds[roundId].isFinalized, "Already finalized");
        require(block.timestamp > rounds[roundId].endTime, "Round not ended");

        rounds[roundId].isFinalized = true;
        emit RoundFinalized(roundId);
    }

    function getRoundInfo(uint256 roundId) external view returns (Round memory) {
        require(roundId > 0 && roundId <= roundCount, "Round does not exist");
        return rounds[roundId];
    }

    function registerProjectForRound(uint256 roundId, uint256 projectId) external onlyOwner {
        require(roundId > 0 && roundId <= roundCount, "Round does not exist");
        roundProjects[roundId][projectId] = true;
        rounds[roundId].totalProjects++;
    }

    function recordDonation(uint256 roundId, address donor) external onlyOwner {
        require(roundId > 0 && roundId <= roundCount, "Round does not exist");
        if (!roundDonors[roundId][donor]) {
            roundDonors[roundId][donor] = true;
            rounds[roundId].totalDonors++;
        }
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
