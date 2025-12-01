const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FHEQuadraticFunding", function () {
  let quadraticFunding;
  let projectRegistry;
  let donationRound;
  let matchingPool;
  let mockToken;

  let owner;
  let feeRecipient;
  let projectOwner1;
  let projectOwner2;
  let donor1;
  let donor2;

  const ONE_HOUR = 3600;
  const ONE_DAY = 86400;
  const ONE_WEEK = ONE_DAY * 7;

  beforeEach(async function () {
    [owner, feeRecipient, projectOwner1, projectOwner2, donor1, donor2] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Donation Token", "DON", 18);
    await mockToken.waitForDeployment();

    // Deploy mock component contracts for local testing
    const MockFHEProjectRegistry = await ethers.getContractFactory("MockFHEProjectRegistry");
    projectRegistry = await MockFHEProjectRegistry.deploy();
    await projectRegistry.waitForDeployment();

    const MockFHEDonationRound = await ethers.getContractFactory("MockFHEDonationRound");
    donationRound = await MockFHEDonationRound.deploy();
    await donationRound.waitForDeployment();

    const MockFHEMatchingPool = await ethers.getContractFactory("MockFHEMatchingPool");
    matchingPool = await MockFHEMatchingPool.deploy(await mockToken.getAddress());
    await matchingPool.waitForDeployment();

    // Deploy mock main contract
    const MockFHEQuadraticFunding = await ethers.getContractFactory("MockFHEQuadraticFunding");
    quadraticFunding = await MockFHEQuadraticFunding.deploy(
      await projectRegistry.getAddress(),
      await donationRound.getAddress(),
      await matchingPool.getAddress(),
      feeRecipient.address
    );
    await quadraticFunding.waitForDeployment();

    // Transfer ownership to main contract
    await projectRegistry.transferOwnership(await quadraticFunding.getAddress());
    await donationRound.transferOwnership(await quadraticFunding.getAddress());
    await matchingPool.transferOwnership(await quadraticFunding.getAddress());

    // Mint tokens
    await mockToken.mint(donor1.address, ethers.parseEther("10000"));
    await mockToken.mint(donor2.address, ethers.parseEther("10000"));
    await mockToken.mint(await matchingPool.getAddress(), ethers.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("should set correct contract references", async function () {
      expect(await quadraticFunding.projectRegistry()).to.equal(await projectRegistry.getAddress());
      expect(await quadraticFunding.donationRound()).to.equal(await donationRound.getAddress());
      expect(await quadraticFunding.matchingPool()).to.equal(await matchingPool.getAddress());
      expect(await quadraticFunding.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("should set correct initial configuration", async function () {
      expect(await quadraticFunding.platformFeePercentage()).to.equal(250n); // 2.5%
      expect(await quadraticFunding.minDonorsForMatching()).to.equal(5n);
      expect(await quadraticFunding.donationCooldown()).to.equal(60n); // 1 minute
    });
  });

  describe("Project Management via Main Contract", function () {
    it("should register a project through main contract", async function () {
      const metadataURI = "ipfs://QmTest123";

      await expect(
        quadraticFunding.connect(projectOwner1).registerProject(metadataURI)
      ).to.emit(quadraticFunding, "ProjectRegistered")
        .withArgs(1, projectOwner1.address, metadataURI);
    });

    it("should verify a project by admin", async function () {
      await quadraticFunding.connect(projectOwner1).registerProject("ipfs://test");

      await expect(
        quadraticFunding.connect(owner).verifyProject(1, true)
      ).to.emit(quadraticFunding, "ProjectVerified")
        .withArgs(1, true);
    });

    it("should update project metadata", async function () {
      await quadraticFunding.connect(projectOwner1).registerProject("ipfs://original");
      await quadraticFunding.connect(projectOwner1).updateProjectMetadata(1, "ipfs://updated");

      const project = await quadraticFunding.getProject(1);
      expect(project.metadataURI).to.equal("ipfs://updated");
    });

    it("should deactivate a project", async function () {
      await quadraticFunding.connect(projectOwner1).registerProject("ipfs://test");
      await quadraticFunding.connect(projectOwner1).deactivateProject(1);

      const project = await quadraticFunding.getProject(1);
      expect(project.isActive).to.be.false;
    });
  });

  describe("Round Management via Main Contract", function () {
    it("should create a funding round", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + ONE_HOUR;
      const endTime = startTime + ONE_WEEK;

      await expect(
        quadraticFunding.createRound(
          "Test Round",
          startTime,
          endTime,
          ethers.parseEther("10"),
          ethers.parseEther("0.01"),
          ethers.parseEther("100")
        )
      ).to.emit(quadraticFunding, "RoundCreated");

      const roundInfo = await quadraticFunding.getRoundInfo(1);
      expect(roundInfo.name).to.equal("Test Round");
    });

    it("should add to matching pool", async function () {
      const currentTime = await time.latest();
      await quadraticFunding.createRound(
        "Test Round",
        currentTime + ONE_HOUR,
        currentTime + ONE_WEEK,
        ethers.parseEther("10"),
        ethers.parseEther("0.01"),
        ethers.parseEther("100")
      );

      await quadraticFunding.addToMatchingPool(1, ethers.parseEther("5"));
      // No revert means success
    });
  });

  describe("Credential Management", function () {
    it("should update user credential", async function () {
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("credential"));

      await expect(
        quadraticFunding.connect(donor1).updateCredential(credentialHash)
      ).to.emit(quadraticFunding, "CredentialUpdated")
        .withArgs(donor1.address, credentialHash);
    });

    it("should verify user credential", async function () {
      const isVerified = await quadraticFunding.verifyCredential(donor1.address);
      expect(isVerified).to.be.true; // Default: credentials not required
    });

    it("should set credential verifier", async function () {
      await quadraticFunding.connect(owner).setCredentialVerifier(donor1.address);
      // No revert means success
    });
  });

  describe("Configuration", function () {
    it("should set platform fee", async function () {
      await quadraticFunding.connect(owner).setPlatformFee(500); // 5%
      expect(await quadraticFunding.platformFeePercentage()).to.equal(500n);
    });

    it("should fail to set fee too high", async function () {
      await expect(
        quadraticFunding.connect(owner).setPlatformFee(1001) // > 10%
      ).to.be.revertedWith("Fee too high");
    });

    it("should set fee recipient", async function () {
      await quadraticFunding.connect(owner).setFeeRecipient(donor1.address);
      expect(await quadraticFunding.feeRecipient()).to.equal(donor1.address);
    });

    it("should fail to set zero address fee recipient", async function () {
      await expect(
        quadraticFunding.connect(owner).setFeeRecipient(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient");
    });

    it("should set donation cooldown", async function () {
      await quadraticFunding.connect(owner).setDonationCooldown(120); // 2 minutes
      expect(await quadraticFunding.donationCooldown()).to.equal(120n);
    });

    it("should fail to set cooldown too long", async function () {
      await expect(
        quadraticFunding.connect(owner).setDonationCooldown(ONE_HOUR + 1)
      ).to.be.revertedWith("Cooldown too long");
    });

    it("should update contract references", async function () {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const newToken = await MockERC20.deploy("New", "NEW", 18);

      const MockFHEMatchingPool = await ethers.getContractFactory("MockFHEMatchingPool");
      const newMatchingPool = await MockFHEMatchingPool.deploy(await newToken.getAddress());

      await quadraticFunding.connect(owner).updateContracts(
        ethers.ZeroAddress, // Don't update registry
        ethers.ZeroAddress, // Don't update round
        await newMatchingPool.getAddress()
      );

      expect(await quadraticFunding.matchingPool()).to.equal(await newMatchingPool.getAddress());
    });
  });

  describe("Receipt Management", function () {
    it("should get donor receipts (empty)", async function () {
      const receipts = await quadraticFunding.getDonorReceipts(donor1.address);
      expect(receipts.length).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("should only allow owner to verify projects", async function () {
      await quadraticFunding.connect(projectOwner1).registerProject("ipfs://test");

      await expect(
        quadraticFunding.connect(donor1).verifyProject(1, true)
      ).to.be.revertedWithCustomError(quadraticFunding, "OwnableUnauthorizedAccount");
    });

    it("should only allow owner to set platform fee", async function () {
      await expect(
        quadraticFunding.connect(donor1).setPlatformFee(500)
      ).to.be.revertedWithCustomError(quadraticFunding, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pausable", function () {
    it("should pause project registration", async function () {
      await quadraticFunding.connect(owner).pause();

      await expect(
        quadraticFunding.connect(projectOwner1).registerProject("ipfs://test")
      ).to.be.revertedWithCustomError(quadraticFunding, "EnforcedPause");
    });

    it("should unpause", async function () {
      await quadraticFunding.connect(owner).pause();
      await quadraticFunding.connect(owner).unpause();

      await expect(
        quadraticFunding.connect(projectOwner1).registerProject("ipfs://test")
      ).to.not.be.reverted;
    });
  });

  describe("Round Finalization Flow", function () {
    let roundId;

    beforeEach(async function () {
      // Setup: Register projects and create round
      await quadraticFunding.connect(projectOwner1).registerProject("ipfs://p1");
      await quadraticFunding.connect(projectOwner2).registerProject("ipfs://p2");
      await quadraticFunding.connect(owner).verifyProject(1, true);
      await quadraticFunding.connect(owner).verifyProject(2, true);

      const currentTime = await time.latest();
      await quadraticFunding.createRound(
        "Finalization Test",
        currentTime + ONE_HOUR,
        currentTime + ONE_HOUR + ONE_WEEK,
        ethers.parseEther("10"),
        ethers.parseEther("0.01"),
        ethers.parseEther("100")
      );
      roundId = 1n;
    });

    it("should finalize round after end time", async function () {
      const currentTime = await time.latest();
      await time.increaseTo(currentTime + ONE_HOUR + ONE_WEEK + 1);

      await expect(
        quadraticFunding.connect(owner).finalizeRound(roundId)
      ).to.emit(quadraticFunding, "RoundFinalized");
    });
  });

  describe("Batch Donations", function () {
    it("should revert batch donations (not supported)", async function () {
      await expect(
        quadraticFunding.connect(donor1).donateBatch(
          1,
          [1, 2],
          ["0x", "0x"],
          ["0x", "0x"]
        )
      ).to.be.revertedWith("Batch donations not supported. Use individual donate() calls.");
    });
  });

  describe("Emergency Functions", function () {
    it("should allow owner to emergency withdraw", async function () {
      // Note: This calls through to matchingPool.emergencyWithdraw
      // The ownership check happens in matchingPool
      // Since we transferred ownership to quadraticFunding, this should work
      await expect(
        quadraticFunding.connect(owner).withdrawEmergency(
          await mockToken.getAddress(),
          ethers.parseEther("100")
        )
      ).to.not.be.reverted;
    });
  });
});
