const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FHEMatchingPool", function () {
  let matchingPool;
  let mockToken;
  let owner;
  let contributor1;
  let contributor2;
  let projectRecipient;

  const ONE_DAY = 86400;
  const ONE_WEEK = ONE_DAY * 7;

  beforeEach(async function () {
    [owner, contributor1, contributor2, projectRecipient] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Donation Token", "DON", 18);
    await mockToken.waitForDeployment();

    // Deploy mock matching pool for local testing
    const MockFHEMatchingPool = await ethers.getContractFactory("MockFHEMatchingPool");
    matchingPool = await MockFHEMatchingPool.deploy(await mockToken.getAddress());
    await matchingPool.waitForDeployment();

    // Mint tokens for testing
    await mockToken.mint(contributor1.address, ethers.parseEther("10000"));
    await mockToken.mint(contributor2.address, ethers.parseEther("10000"));
    await mockToken.mint(await matchingPool.getAddress(), ethers.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("should set the correct donation token", async function () {
      expect(await matchingPool.donationToken()).to.equal(await mockToken.getAddress());
    });

    it("should set initial configuration values", async function () {
      expect(await matchingPool.revealDelay()).to.equal(ONE_WEEK);
      expect(await matchingPool.claimDeadline()).to.equal(ONE_DAY * 30);
      expect(await matchingPool.minStreamDuration()).to.equal(ONE_DAY);
      expect(await matchingPool.maxStreamDuration()).to.equal(ONE_DAY * 365);
    });
  });

  describe("Configuration", function () {
    it("should set donation token", async function () {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const newToken = await MockERC20.deploy("New Token", "NEW", 18);
      await newToken.waitForDeployment();

      await matchingPool.setDonationToken(await newToken.getAddress());
      expect(await matchingPool.donationToken()).to.equal(await newToken.getAddress());
    });

    it("should fail to set zero address token", async function () {
      await expect(
        matchingPool.setDonationToken(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid token");
    });

    it("should set reveal delay", async function () {
      await matchingPool.setRevealDelay(ONE_DAY * 14);
      expect(await matchingPool.revealDelay()).to.equal(ONE_DAY * 14);
    });

    it("should fail to set reveal delay too short", async function () {
      await expect(
        matchingPool.setRevealDelay(ONE_DAY - 1)
      ).to.be.revertedWith("Delay too short");
    });

    it("should set claim deadline", async function () {
      await matchingPool.setClaimDeadline(ONE_DAY * 60);
      expect(await matchingPool.claimDeadline()).to.equal(ONE_DAY * 60);
    });

    it("should fail to set claim deadline too short", async function () {
      await expect(
        matchingPool.setClaimDeadline(ONE_WEEK - 1)
      ).to.be.revertedWith("Deadline too short");
    });

    it("should only allow owner to configure", async function () {
      await expect(
        matchingPool.connect(contributor1).setRevealDelay(ONE_DAY * 14)
      ).to.be.revertedWithCustomError(matchingPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pool Statistics", function () {
    it("should return pool stats", async function () {
      const roundId = 1;
      const stats = await matchingPool.getPoolStats(roundId);

      expect(stats.totalContributors).to.equal(0n);
    });
  });

  describe("Emergency Withdrawal", function () {
    it("should withdraw ERC20 tokens", async function () {
      const amount = ethers.parseEther("1000");
      const balanceBefore = await mockToken.balanceOf(owner.address);

      await matchingPool.emergencyWithdraw(await mockToken.getAddress(), amount);

      const balanceAfter = await mockToken.balanceOf(owner.address);
      expect(balanceAfter - balanceBefore).to.equal(amount);
    });

    it("should withdraw ETH", async function () {
      // Send some ETH to the contract
      await owner.sendTransaction({
        to: await matchingPool.getAddress(),
        value: ethers.parseEther("1")
      });

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await matchingPool.emergencyWithdraw(ethers.ZeroAddress, ethers.parseEther("1"));
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter + gasCost - balanceBefore).to.equal(ethers.parseEther("1"));
    });

    it("should only allow owner to withdraw", async function () {
      await expect(
        matchingPool.connect(contributor1).emergencyWithdraw(
          await mockToken.getAddress(),
          ethers.parseEther("100")
        )
      ).to.be.revertedWithCustomError(matchingPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pausable", function () {
    it("should pause and unpause", async function () {
      await matchingPool.pause();
      await matchingPool.unpause();
    });

    it("should only allow owner to pause", async function () {
      await expect(
        matchingPool.connect(contributor1).pause()
      ).to.be.revertedWithCustomError(matchingPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Stream Management", function () {
    it("should return stream info for non-existent stream", async function () {
      const info = await matchingPool.getStreamInfo(1);
      expect(info.sender).to.equal(ethers.ZeroAddress);
      expect(info.projectId).to.equal(0n);
      expect(info.isActive).to.be.false;
    });

    it("should batch update streams (empty batch)", async function () {
      await matchingPool.batchUpdateStreams([]);
    });
  });

  describe("Receive ETH", function () {
    it("should receive ETH", async function () {
      const amount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await matchingPool.getAddress(),
        value: amount
      });

      const balance = await ethers.provider.getBalance(await matchingPool.getAddress());
      expect(balance).to.equal(amount);
    });
  });
});
