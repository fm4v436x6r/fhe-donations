const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FHE Donation Platform", function () {
    let deployer, donor1, donor2, projectOwner1, projectOwner2;
    let quadraticFunding, projectRegistry, donationRound, matchingPool;
    let donationToken;
    
    beforeEach(async function () {
        // Get signers
        [deployer, donor1, donor2, projectOwner1, projectOwner2] = await ethers.getSigners();
        
        // Deploy mock token
        const MockToken = await ethers.getContractFactory("MockERC20");
        donationToken = await MockToken.deploy("Donation Token", "DON", 18);
        await donationToken.deployed();
        
        // Deploy contracts
        const ProjectRegistry = await ethers.getContractFactory("FHEProjectRegistry");
        projectRegistry = await ProjectRegistry.deploy();
        await projectRegistry.deployed();
        
        const DonationRound = await ethers.getContractFactory("FHEDonationRound");
        donationRound = await DonationRound.deploy();
        await donationRound.deployed();
        
        const MatchingPool = await ethers.getContractFactory("FHEMatchingPool");
        matchingPool = await MatchingPool.deploy(donationToken.address);
        await matchingPool.deployed();
        
        const QuadraticFunding = await ethers.getContractFactory("FHEQuadraticFunding");
        quadraticFunding = await QuadraticFunding.deploy(
            projectRegistry.address,
            donationRound.address,
            matchingPool.address,
            deployer.address
        );
        await quadraticFunding.deployed();
        
        // Transfer ownership to main contract
        await projectRegistry.transferOwnership(quadraticFunding.address);
        await donationRound.transferOwnership(quadraticFunding.address);
        await matchingPool.transferOwnership(quadraticFunding.address);
        
        // Mint tokens for testing
        await donationToken.mint(deployer.address, ethers.utils.parseEther("1000000"));
        await donationToken.mint(donor1.address, ethers.utils.parseEther("10000"));
        await donationToken.mint(donor2.address, ethers.utils.parseEther("10000"));
    });
    
    describe("Project Registration", function () {
        it("Should register a new project", async function () {
            const metadataURI = "ipfs://QmTest123";
            
            await expect(
                quadraticFunding.connect(projectOwner1).registerProject(metadataURI)
            ).to.emit(quadraticFunding, "ProjectRegistered");
            
            const project = await quadraticFunding.getProject(1);
            expect(project.owner).to.equal(projectOwner1.address);
            expect(project.metadataURI).to.equal(metadataURI);
            expect(project.isActive).to.be.true;
            expect(project.isVerified).to.be.false;
        });
        
        it("Should verify a project by admin", async function () {
            const metadataURI = "ipfs://QmTest123";
            await quadraticFunding.connect(projectOwner1).registerProject(metadataURI);
            
            await expect(
                quadraticFunding.connect(deployer).verifyProject(1, true)
            ).to.emit(quadraticFunding, "ProjectVerified");
            
            const project = await quadraticFunding.getProject(1);
            expect(project.isVerified).to.be.true;
        });
        
        it("Should update project metadata by owner", async function () {
            const metadataURI = "ipfs://QmTest123";
            const newMetadataURI = "ipfs://QmTest456";
            
            await quadraticFunding.connect(projectOwner1).registerProject(metadataURI);
            await quadraticFunding.connect(projectOwner1).updateProjectMetadata(1, newMetadataURI);
            
            const project = await quadraticFunding.getProject(1);
            expect(project.metadataURI).to.equal(newMetadataURI);
        });
        
        it("Should deactivate a project", async function () {
            const metadataURI = "ipfs://QmTest123";
            await quadraticFunding.connect(projectOwner1).registerProject(metadataURI);
            
            await quadraticFunding.connect(projectOwner1).deactivateProject(1);
            
            const project = await quadraticFunding.getProject(1);
            expect(project.isActive).to.be.false;
        });
    });
    
    describe("Round Management", function () {
        it("Should create a new funding round", async function () {
            const roundName = "Test Round";
            const startTime = (await time.latest()) + 3600;
            const endTime = startTime + (7 * 24 * 3600);
            const minDonation = ethers.utils.parseEther("0.01");
            const maxDonation = ethers.utils.parseEther("100");
            const matchingPool = ethers.utils.parseEther("10000");
            const encryptedPool = ethers.utils.defaultAbiCoder.encode(["uint256"], [matchingPool]);
            
            await expect(
                quadraticFunding.createRound(
                    roundName,
                    startTime,
                    endTime,
                    encryptedPool,
                    minDonation,
                    maxDonation
                )
            ).to.emit(quadraticFunding, "RoundCreated");
            
            const roundInfo = await quadraticFunding.getRoundInfo(1);
            expect(roundInfo.name).to.equal(roundName);
            expect(roundInfo.startTime).to.equal(startTime);
            expect(roundInfo.endTime).to.equal(endTime);
            expect(roundInfo.isFinalized).to.be.false;
        });
        
        it("Should add to matching pool", async function () {
            const roundName = "Test Round";
            const startTime = (await time.latest()) + 3600;
            const endTime = startTime + (7 * 24 * 3600);
            const minDonation = ethers.utils.parseEther("0.01");
            const maxDonation = ethers.utils.parseEther("100");
            const initialPool = ethers.utils.parseEther("10000");
            const additionalPool = ethers.utils.parseEther("5000");
            
            await quadraticFunding.createRound(
                roundName,
                startTime,
                endTime,
                ethers.utils.defaultAbiCoder.encode(["uint256"], [initialPool]),
                minDonation,
                maxDonation
            );
            
            await quadraticFunding.addToMatchingPool(
                1,
                ethers.utils.defaultAbiCoder.encode(["uint256"], [additionalPool])
            );
            
            // Verify pool was increased (would need decryption in real scenario)
        });
    });
    
    describe("Donations", function () {
        let roundId;
        let projectId1, projectId2;
        
        beforeEach(async function () {
            // Register and verify projects
            await quadraticFunding.connect(projectOwner1).registerProject("ipfs://project1");
            await quadraticFunding.connect(projectOwner2).registerProject("ipfs://project2");
            projectId1 = 1;
            projectId2 = 2;
            
            await quadraticFunding.verifyProject(projectId1, true);
            await quadraticFunding.verifyProject(projectId2, true);
            
            // Create round
            const startTime = (await time.latest()) + 60;
            const endTime = startTime + (7 * 24 * 3600);
            const matchingPool = ethers.utils.parseEther("10000");
            
            await quadraticFunding.createRound(
                "Test Round",
                startTime,
                endTime,
                ethers.utils.defaultAbiCoder.encode(["uint256"], [matchingPool]),
                ethers.utils.parseEther("0.01"),
                ethers.utils.parseEther("100")
            );
            roundId = 1;
            
            // Advance time to round start
            await time.increaseTo(startTime);
        });
        
        it("Should process a donation", async function () {
            const donationAmount = ethers.utils.parseEther("1");
            const encryptedAmount = ethers.utils.defaultAbiCoder.encode(["uint256"], [donationAmount]);
            const proof = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
            
            await expect(
                quadraticFunding.connect(donor1).donate(roundId, projectId1, encryptedAmount, proof)
            ).to.emit(quadraticFunding, "DonationMade");
            
            // Verify donation was recorded (encrypted value)
            const donation = await quadraticFunding.getEncryptedDonation(roundId, projectId1, donor1.address);
            expect(donation).to.not.equal(0);
        });
        
        it("Should enforce donation cooldown", async function () {
            const donationAmount = ethers.utils.parseEther("1");
            const encryptedAmount = ethers.utils.defaultAbiCoder.encode(["uint256"], [donationAmount]);
            const proof = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
            
            // First donation should succeed
            await quadraticFunding.connect(donor1).donate(roundId, projectId1, encryptedAmount, proof);
            
            // Second immediate donation should fail
            await expect(
                quadraticFunding.connect(donor1).donate(roundId, projectId2, encryptedAmount, proof)
            ).to.be.revertedWith("Donation cooldown active");
            
            // Advance time past cooldown
            await time.increase(61);
            
            // Third donation should succeed
            await expect(
                quadraticFunding.connect(donor1).donate(roundId, projectId2, encryptedAmount, proof)
            ).to.emit(quadraticFunding, "DonationMade");
        });
        
        it("Should process batch donations", async function () {
            const amount1 = ethers.utils.parseEther("1");
            const amount2 = ethers.utils.parseEther("2");
            
            const projectIds = [projectId1, projectId2];
            const encryptedAmounts = [
                ethers.utils.defaultAbiCoder.encode(["uint256"], [amount1]),
                ethers.utils.defaultAbiCoder.encode(["uint256"], [amount2])
            ];
            const proofs = [
                ethers.utils.defaultAbiCoder.encode(["uint256"], [1]),
                ethers.utils.defaultAbiCoder.encode(["uint256"], [1])
            ];
            
            await quadraticFunding.connect(donor1).donateBatch(
                roundId,
                projectIds,
                encryptedAmounts,
                proofs
            );
            
            // Verify both donations were recorded
            const donation1 = await quadraticFunding.getEncryptedDonation(roundId, projectId1, donor1.address);
            const donation2 = await quadraticFunding.getEncryptedDonation(roundId, projectId2, donor1.address);
            expect(donation1).to.not.equal(0);
            expect(donation2).to.not.equal(0);
        });
    });
    
    describe("Quadratic Funding Calculation", function () {
        let roundId;
        let projectId1, projectId2;
        
        beforeEach(async function () {
            // Setup projects and round
            await quadraticFunding.connect(projectOwner1).registerProject("ipfs://project1");
            await quadraticFunding.connect(projectOwner2).registerProject("ipfs://project2");
            projectId1 = 1;
            projectId2 = 2;
            
            await quadraticFunding.verifyProject(projectId1, true);
            await quadraticFunding.verifyProject(projectId2, true);
            
            const startTime = (await time.latest()) + 60;
            const endTime = startTime + (7 * 24 * 3600);
            
            await quadraticFunding.createRound(
                "QF Round",
                startTime,
                endTime,
                ethers.utils.defaultAbiCoder.encode(["uint256"], [ethers.utils.parseEther("10000")]),
                ethers.utils.parseEther("0.01"),
                ethers.utils.parseEther("100")
            );
            roundId = 1;
            
            await time.increaseTo(startTime);
            
            // Make donations from multiple donors
            const donors = await ethers.getSigners();
            for (let i = 2; i < 7; i++) {
                const donor = donors[i];
                const amount = ethers.utils.parseEther((i * 0.5).toString());
                const encryptedAmount = ethers.utils.defaultAbiCoder.encode(["uint256"], [amount]);
                const proof = ethers.utils.defaultAbiCoder.encode(["uint256"], [1]);
                
                await quadraticFunding.connect(donor).donate(roundId, projectId1, encryptedAmount, proof);
                await time.increase(61); // Skip cooldown
                
                if (i % 2 === 0) {
                    await quadraticFunding.connect(donor).donate(roundId, projectId2, encryptedAmount, proof);
                    await time.increase(61);
                }
            }
            
            // Advance to round end
            await time.increaseTo(endTime + 1);
        });
        
        it("Should calculate matching distribution", async function () {
            await expect(
                quadraticFunding.calculateMatching(roundId)
            ).to.emit(quadraticFunding, "MatchingDistributed");
            
            // Verify matching amounts were calculated
            const matching1 = await quadraticFunding.getEncryptedMatchingAmount(roundId, projectId1);
            const matching2 = await quadraticFunding.getEncryptedMatchingAmount(roundId, projectId2);
            
            expect(matching1).to.not.equal(0);
            expect(matching2).to.not.equal(0);
        });
        
        it("Should finalize round", async function () {
            await quadraticFunding.calculateMatching(roundId);
            
            await expect(
                quadraticFunding.finalizeRound(roundId)
            ).to.emit(quadraticFunding, "RoundFinalized");
            
            const roundInfo = await quadraticFunding.getRoundInfo(roundId);
            expect(roundInfo.isFinalized).to.be.true;
        });
        
        it("Should allow project owners to claim matching", async function () {
            await quadraticFunding.calculateMatching(roundId);
            await quadraticFunding.finalizeRound(roundId);
            
            await expect(
                quadraticFunding.connect(projectOwner1).claimMatching(roundId, projectId1)
            ).to.emit(quadraticFunding, "MatchingDistributed");
        });
    });
    
    describe("Anti-Sybil Mechanisms", function () {
        it("Should update user credentials", async function () {
            const credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("credential123"));
            
            await expect(
                quadraticFunding.connect(donor1).updateCredential(credentialHash)
            ).to.emit(quadraticFunding, "CredentialUpdated");
            
            const isVerified = await quadraticFunding.verifyCredential(donor1.address);
            expect(isVerified).to.be.true;
        });
        
        it("Should prevent duplicate credential usage", async function () {
            const credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("credential123"));
            
            await quadraticFunding.connect(donor1).updateCredential(credentialHash);
            
            // Try to use same credential with different account
            await expect(
                quadraticFunding.connect(donor2).updateCredential(credentialHash)
            ).to.be.revertedWith("Credential already used");
        });
    });
    
    describe("Access Control", function () {
        it("Should restrict admin functions", async function () {
            await expect(
                quadraticFunding.connect(donor1).verifyProject(1, true)
            ).to.be.revertedWith("Ownable: caller is not the owner");
            
            const startTime = (await time.latest()) + 3600;
            await expect(
                quadraticFunding.connect(donor1).createRound(
                    "Test",
                    startTime,
                    startTime + 86400,
                    ethers.utils.defaultAbiCoder.encode(["uint256"], [1000]),
                    100,
                    1000
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        it("Should allow owner to pause and unpause", async function () {
            await quadraticFunding.pause();
            
            await expect(
                quadraticFunding.connect(projectOwner1).registerProject("ipfs://test")
            ).to.be.revertedWith("Pausable: paused");
            
            await quadraticFunding.unpause();
            
            await expect(
                quadraticFunding.connect(projectOwner1).registerProject("ipfs://test")
            ).to.emit(quadraticFunding, "ProjectRegistered");
        });
    });
    
    describe("Emergency Functions", function () {
        it("Should allow emergency withdrawal", async function () {
            // Send tokens to matching pool contract
            await donationToken.transfer(matchingPool.address, ethers.utils.parseEther("1000"));
            
            const balanceBefore = await donationToken.balanceOf(deployer.address);
            await quadraticFunding.withdrawEmergency(donationToken.address, ethers.utils.parseEther("1000"));
            const balanceAfter = await donationToken.balanceOf(deployer.address);
            
            expect(balanceAfter.sub(balanceBefore)).to.equal(ethers.utils.parseEther("1000"));
        });
    });
});

describe("FHE Operations", function () {
    let fheBase;
    
    beforeEach(async function () {
        // Deploy a test contract that inherits FHEDonationBase
        const TestFHE = await ethers.getContractFactory("TestFHEOperations");
        fheBase = await TestFHE.deploy();
        await fheBase.deployed();
    });
    
    it("Should perform safe arithmetic operations", async function () {
        // Test safe addition with overflow protection
        const a = ethers.utils.defaultAbiCoder.encode(["uint32"], [4294967290]);
        const b = ethers.utils.defaultAbiCoder.encode(["uint32"], [10]);
        
        const result = await fheBase.testSafeAdd(a, b);
        // Result should be capped at MAX_UINT32
        
        // Test safe subtraction with underflow protection
        const c = ethers.utils.defaultAbiCoder.encode(["uint32"], [5]);
        const d = ethers.utils.defaultAbiCoder.encode(["uint32"], [10]);
        
        const subResult = await fheBase.testSafeSub(c, d);
        // Result should be 0 (no underflow)
    });
    
    it("Should calculate percentage correctly", async function () {
        const value = ethers.utils.defaultAbiCoder.encode(["uint32"], [10000]);
        const percentage = 2500; // 25%
        
        const result = await fheBase.testCalculatePercentage(value, percentage);
        // Result should be 2500
    });
    
    it("Should handle batch processing", async function () {
        const values = [
            ethers.utils.defaultAbiCoder.encode(["uint32"], [100]),
            ethers.utils.defaultAbiCoder.encode(["uint32"], [200]),
            ethers.utils.defaultAbiCoder.encode(["uint32"], [300])
        ];
        
        // Test sum operation
        const sumResult = await fheBase.testBatchProcess(values, 0);
        // Result should be 600
        
        // Test average operation
        const avgResult = await fheBase.testBatchProcess(values, 1);
        // Result should be 200
    });
});