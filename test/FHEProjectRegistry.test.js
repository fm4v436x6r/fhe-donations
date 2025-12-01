const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FHEProjectRegistry", function () {
  let registry;
  let owner;
  let projectOwner1;
  let projectOwner2;
  let user1;

  beforeEach(async function () {
    [owner, projectOwner1, projectOwner2, user1] = await ethers.getSigners();

    // Use mock contract for local testing
    const MockFHEProjectRegistry = await ethers.getContractFactory("MockFHEProjectRegistry");
    registry = await MockFHEProjectRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Project Registration", function () {
    it("should register a new project", async function () {
      const metadataURI = "ipfs://QmTest123";

      await expect(registry.connect(projectOwner1).registerProject(metadataURI))
        .to.emit(registry, "ProjectRegistered")
        .withArgs(1, projectOwner1.address, metadataURI);

      const project = await registry.getProject(1);
      expect(project.owner).to.equal(projectOwner1.address);
      expect(project.metadataURI).to.equal(metadataURI);
      expect(project.isActive).to.be.true;
      expect(project.isVerified).to.be.false;
    });

    it("should register multiple projects", async function () {
      await registry.connect(projectOwner1).registerProject("ipfs://project1");
      await registry.connect(projectOwner2).registerProject("ipfs://project2");

      const project1 = await registry.getProject(1);
      const project2 = await registry.getProject(2);

      expect(project1.owner).to.equal(projectOwner1.address);
      expect(project2.owner).to.equal(projectOwner2.address);
    });

    it("should fail to register with empty metadata URI", async function () {
      await expect(
        registry.connect(projectOwner1).registerProject("")
      ).to.be.revertedWith("Empty metadata URI");
    });

    it("should track owner projects", async function () {
      await registry.connect(projectOwner1).registerProject("ipfs://project1");
      await registry.connect(projectOwner1).registerProject("ipfs://project2");

      const ownerProjects = await registry.getOwnerProjects(projectOwner1.address);
      expect(ownerProjects.length).to.equal(2);
      expect(ownerProjects[0]).to.equal(1n);
      expect(ownerProjects[1]).to.equal(2n);
    });
  });

  describe("Project Updates", function () {
    beforeEach(async function () {
      await registry.connect(projectOwner1).registerProject("ipfs://original");
    });

    it("should update project metadata by owner", async function () {
      const newMetadataURI = "ipfs://updated";

      await expect(registry.connect(projectOwner1).updateProjectMetadata(1, newMetadataURI))
        .to.emit(registry, "ProjectUpdated")
        .withArgs(1, newMetadataURI);

      const project = await registry.getProject(1);
      expect(project.metadataURI).to.equal(newMetadataURI);
    });

    it("should fail to update by non-owner", async function () {
      await expect(
        registry.connect(projectOwner2).updateProjectMetadata(1, "ipfs://hack")
      ).to.be.revertedWith("Not project owner");
    });

    it("should fail to update non-existent project", async function () {
      await expect(
        registry.connect(projectOwner1).updateProjectMetadata(999, "ipfs://test")
      ).to.be.revertedWith("Project does not exist");
    });
  });

  describe("Project Verification", function () {
    beforeEach(async function () {
      await registry.connect(projectOwner1).registerProject("ipfs://test");
    });

    it("should verify project by admin", async function () {
      await expect(registry.connect(owner).verifyProject(1, true))
        .to.emit(registry, "ProjectVerified")
        .withArgs(1, true);

      const project = await registry.getProject(1);
      expect(project.isVerified).to.be.true;
    });

    it("should unverify project by admin", async function () {
      await registry.connect(owner).verifyProject(1, true);
      await registry.connect(owner).verifyProject(1, false);

      const project = await registry.getProject(1);
      expect(project.isVerified).to.be.false;
    });

    it("should fail to verify by non-admin", async function () {
      await expect(
        registry.connect(projectOwner1).verifyProject(1, true)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should batch verify projects", async function () {
      await registry.connect(projectOwner1).registerProject("ipfs://project2");
      await registry.connect(projectOwner2).registerProject("ipfs://project3");

      await registry.connect(owner).batchVerifyProjects([1, 2, 3], [true, true, false]);

      const project1 = await registry.getProject(1);
      const project2 = await registry.getProject(2);
      const project3 = await registry.getProject(3);

      expect(project1.isVerified).to.be.true;
      expect(project2.isVerified).to.be.true;
      expect(project3.isVerified).to.be.false;
    });
  });

  describe("Project Deactivation", function () {
    beforeEach(async function () {
      await registry.connect(projectOwner1).registerProject("ipfs://test");
    });

    it("should deactivate project by owner", async function () {
      await expect(registry.connect(projectOwner1).deactivateProject(1))
        .to.emit(registry, "ProjectDeactivated")
        .withArgs(1);

      const project = await registry.getProject(1);
      expect(project.isActive).to.be.false;
    });

    it("should deactivate project by admin", async function () {
      await registry.connect(owner).deactivateProject(1);

      const project = await registry.getProject(1);
      expect(project.isActive).to.be.false;
    });

    it("should fail to deactivate by unauthorized user", async function () {
      await expect(
        registry.connect(user1).deactivateProject(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("should fail to update inactive project metadata", async function () {
      await registry.connect(projectOwner1).deactivateProject(1);

      await expect(
        registry.connect(projectOwner1).updateProjectMetadata(1, "ipfs://new")
      ).to.be.revertedWith("Project is inactive");
    });
  });

  describe("Credential Management", function () {
    it("should update user credential", async function () {
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("credential123"));

      await expect(registry.connect(user1).updateCredential(credentialHash))
        .to.emit(registry, "CredentialUpdated")
        .withArgs(user1.address, credentialHash);
    });

    it("should fail with zero credential hash", async function () {
      await expect(
        registry.connect(user1).updateCredential(ethers.ZeroHash)
      ).to.be.revertedWith("Invalid credential hash");
    });

    it("should prevent duplicate credential usage", async function () {
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("unique"));

      await registry.connect(user1).updateCredential(credentialHash);

      await expect(
        registry.connect(projectOwner1).updateCredential(credentialHash)
      ).to.be.revertedWith("Credential already used");
    });

    it("should allow credential replacement", async function () {
      const cred1 = ethers.keccak256(ethers.toUtf8Bytes("cred1"));
      const cred2 = ethers.keccak256(ethers.toUtf8Bytes("cred2"));

      await registry.connect(user1).updateCredential(cred1);
      await registry.connect(user1).updateCredential(cred2);

      // Old credential should be available now
      await expect(
        registry.connect(projectOwner1).updateCredential(cred1)
      ).to.not.be.reverted;
    });
  });

  describe("Credential Verification", function () {
    it("should verify credential when not required", async function () {
      const isVerified = await registry.verifyCredential(user1.address);
      expect(isVerified).to.be.true;
    });

    it("should require credential when enabled", async function () {
      await registry.connect(owner).setCredentialRequirement(true);

      const isVerified = await registry.verifyCredential(user1.address);
      expect(isVerified).to.be.false;

      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("valid"));
      await registry.connect(user1).updateCredential(credentialHash);

      const isVerifiedAfter = await registry.verifyCredential(user1.address);
      expect(isVerifiedAfter).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("should set credential verifier", async function () {
      await expect(registry.connect(owner).setCredentialVerifier(user1.address))
        .to.emit(registry, "CredentialVerifierSet")
        .withArgs(user1.address);
    });

    it("should fail admin functions by non-owner", async function () {
      await expect(
        registry.connect(user1).setCredentialVerifier(user1.address)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");

      await expect(
        registry.connect(user1).setCredentialRequirement(true)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await registry.connect(projectOwner1).registerProject("ipfs://p1");
      await registry.connect(projectOwner2).registerProject("ipfs://p2");
      await registry.connect(projectOwner1).deactivateProject(1);
    });

    it("should get active project count", async function () {
      const count = await registry.getActiveProjectCount();
      expect(count).to.equal(1n);
    });

    it("should get project details", async function () {
      const project = await registry.getProject(2);
      expect(project.owner).to.equal(projectOwner2.address);
      expect(project.metadataURI).to.equal("ipfs://p2");
      expect(project.isActive).to.be.true;
    });
  });

  describe("Pausable", function () {
    it("should pause and unpause contract", async function () {
      await registry.connect(owner).pause();

      await expect(
        registry.connect(projectOwner1).registerProject("ipfs://test")
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");

      await registry.connect(owner).unpause();

      await expect(
        registry.connect(projectOwner1).registerProject("ipfs://test")
      ).to.not.be.reverted;
    });

    it("should fail to pause by non-owner", async function () {
      await expect(
        registry.connect(user1).pause()
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });
});
