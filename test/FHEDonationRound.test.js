const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FHEDonationRound", function () {
  let donationRound;
  let owner;
  let donor1;
  let donor2;
  let donor3;

  const ONE_HOUR = 3600;
  const ONE_DAY = 86400;
  const ONE_WEEK = ONE_DAY * 7;

  beforeEach(async function () {
    [owner, donor1, donor2, donor3] = await ethers.getSigners();

    // Use mock contract for local testing
    const MockFHEDonationRound = await ethers.getContractFactory("MockFHEDonationRound");
    donationRound = await MockFHEDonationRound.deploy();
    await donationRound.waitForDeployment();
  });

  describe("Round Creation", function () {
    it("should create a new funding round", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + ONE_HOUR;
      const endTime = startTime + ONE_WEEK;

      await expect(
        donationRound.createRound(
          "Test Round",
          startTime,
          endTime,
          ethers.parseEther("10"),
          ethers.parseEther("0.01"),
          ethers.parseEther("100")
        )
      ).to.emit(donationRound, "RoundCreated")
        .withArgs(1, "Test Round", startTime, endTime);

      const roundInfo = await donationRound.getRoundInfo(1);
      expect(roundInfo.name).to.equal("Test Round");
      expect(roundInfo.startTime).to.equal(startTime);
      expect(roundInfo.endTime).to.equal(endTime);
      expect(roundInfo.isFinalized).to.be.false;
    });

    it("should fail with invalid start time", async function () {
      const currentTime = await time.latest();
      const pastTime = currentTime - ONE_HOUR;

      await expect(
        donationRound.createRound(
          "Test Round",
          pastTime,
          pastTime + ONE_WEEK,
          ethers.parseEther("10"),
          ethers.parseEther("0.01"),
          ethers.parseEther("100")
        )
      ).to.be.revertedWith("Invalid start time");
    });

    it("should fail with end time before start time", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + ONE_HOUR;

      await expect(
        donationRound.createRound(
          "Test Round",
          startTime,
          startTime - 1,
          ethers.parseEther("10"),
          ethers.parseEther("0.01"),
          ethers.parseEther("100")
        )
      ).to.be.revertedWith("Invalid end time");
    });

    it("should fail with max donation <= min donation", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + ONE_HOUR;

      await expect(
        donationRound.createRound(
          "Test Round",
          startTime,
          startTime + ONE_WEEK,
          ethers.parseEther("10"),
          ethers.parseEther("100"),
          ethers.parseEther("10")
        )
      ).to.be.revertedWith("Invalid donation limits");
    });

    it("should create multiple rounds", async function () {
      const currentTime = await time.latest();

      await donationRound.createRound(
        "Round 1",
        currentTime + ONE_HOUR,
        currentTime + ONE_WEEK,
        ethers.parseEther("10"),
        ethers.parseEther("0.01"),
        ethers.parseEther("100")
      );

      await donationRound.createRound(
        "Round 2",
        currentTime + ONE_WEEK,
        currentTime + ONE_WEEK * 2,
        ethers.parseEther("20"),
        ethers.parseEther("0.1"),
        ethers.parseEther("50")
      );

      const round1 = await donationRound.getRoundInfo(1);
      const round2 = await donationRound.getRoundInfo(2);

      expect(round1.name).to.equal("Round 1");
      expect(round2.name).to.equal("Round 2");
    });
  });

  describe("Matching Pool", function () {
    let roundId;

    beforeEach(async function () {
      const currentTime = await time.latest();
      await donationRound.createRound(
        "Test Round",
        currentTime + ONE_HOUR,
        currentTime + ONE_WEEK,
        ethers.parseEther("10"),
        ethers.parseEther("0.01"),
        ethers.parseEther("100")
      );
      roundId = 1n;
    });

    it("should add to matching pool", async function () {
      await expect(
        donationRound.addToMatchingPool(roundId, ethers.parseEther("5"))
      ).to.emit(donationRound, "MatchingPoolIncreased")
        .withArgs(roundId, owner.address);
    });

    it("should fail to add zero amount", async function () {
      await expect(
        donationRound.addToMatchingPool(roundId, 0)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("should fail to add to finalized round", async function () {
      const currentTime = await time.latest();
      await time.increaseTo(currentTime + ONE_WEEK + ONE_DAY);
      await donationRound.finalizeRound(roundId);

      await expect(
        donationRound.addToMatchingPool(roundId, ethers.parseEther("5"))
      ).to.be.revertedWith("Round finalized");
    });
  });

  describe("Round Lifecycle", function () {
    let roundId;
    let startTime;
    let endTime;

    beforeEach(async function () {
      const currentTime = await time.latest();
      startTime = currentTime + ONE_HOUR;
      endTime = startTime + ONE_WEEK;

      await donationRound.createRound(
        "Test Round",
        startTime,
        endTime,
        ethers.parseEther("10"),
        ethers.parseEther("0.01"),
        ethers.parseEther("100")
      );
      roundId = 1n;
    });

    it("should not allow finalize before end time", async function () {
      await time.increaseTo(startTime + ONE_DAY);

      await expect(
        donationRound.finalizeRound(roundId)
      ).to.be.revertedWith("Round not ended");
    });

    it("should finalize round after end time", async function () {
      await time.increaseTo(endTime + 1);

      await expect(donationRound.finalizeRound(roundId))
        .to.emit(donationRound, "RoundFinalized");

      const roundInfo = await donationRound.getRoundInfo(roundId);
      expect(roundInfo.isFinalized).to.be.true;
    });

    it("should not allow double finalization", async function () {
      await time.increaseTo(endTime + 1);
      await donationRound.finalizeRound(roundId);

      await expect(
        donationRound.finalizeRound(roundId)
      ).to.be.revertedWith("Already finalized");
    });
  });

  describe("Round Info", function () {
    it("should return correct round info", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + ONE_HOUR;
      const endTime = startTime + ONE_WEEK;

      await donationRound.createRound(
        "Info Test Round",
        startTime,
        endTime,
        ethers.parseEther("15"),
        ethers.parseEther("0.05"),
        ethers.parseEther("50")
      );

      const info = await donationRound.getRoundInfo(1);

      expect(info.name).to.equal("Info Test Round");
      expect(info.startTime).to.equal(startTime);
      expect(info.endTime).to.equal(endTime);
      expect(info.minDonation).to.equal(ethers.parseEther("0.05"));
      expect(info.maxDonation).to.equal(ethers.parseEther("50"));
      expect(info.isFinalized).to.be.false;
      expect(info.totalProjects).to.equal(0n);
      expect(info.totalDonors).to.equal(0n);
    });

    it("should fail for non-existent round", async function () {
      await expect(
        donationRound.getRoundInfo(999)
      ).to.be.revertedWith("Round does not exist");
    });
  });

  describe("Pausable", function () {
    it("should pause and unpause round creation", async function () {
      await donationRound.pause();

      const currentTime = await time.latest();

      await expect(
        donationRound.createRound(
          "Test",
          currentTime + ONE_HOUR,
          currentTime + ONE_WEEK,
          ethers.parseEther("10"),
          ethers.parseEther("0.01"),
          ethers.parseEther("100")
        )
      ).to.be.revertedWithCustomError(donationRound, "EnforcedPause");

      await donationRound.unpause();

      await expect(
        donationRound.createRound(
          "Test",
          currentTime + ONE_HOUR + 60,
          currentTime + ONE_WEEK,
          ethers.parseEther("10"),
          ethers.parseEther("0.01"),
          ethers.parseEther("100")
        )
      ).to.not.be.reverted;
    });
  });

  describe("Access Control", function () {
    let roundId;
    let endTime;

    beforeEach(async function () {
      const currentTime = await time.latest();
      endTime = currentTime + ONE_HOUR + ONE_WEEK;

      await donationRound.createRound(
        "Test Round",
        currentTime + ONE_HOUR,
        endTime,
        ethers.parseEther("10"),
        ethers.parseEther("0.01"),
        ethers.parseEther("100")
      );
      roundId = 1n;
    });

    it("should only allow owner to finalize", async function () {
      await time.increaseTo(endTime + 1);

      await expect(
        donationRound.connect(donor1).finalizeRound(roundId)
      ).to.be.revertedWithCustomError(donationRound, "OwnableUnauthorizedAccount");
    });
  });
});
