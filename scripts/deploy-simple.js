const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Simple deployment script for FHE Donations
 * Note: Batch functions are disabled due to einput type limitations
 */
async function main() {
    console.log("🚀 Starting FHE Donation Platform deployment...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH\n");

    if (balance < ethers.parseEther("0.1")) {
        console.warn("⚠️  Warning: Low balance. You may need more ETH for deployment.\n");
    }

    const deploymentInfo = {
        network: hre.network.name,
        chainId: hre.network.config.chainId || "unknown",
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {}
    };

    try {
        // 1. Deploy Mock Donation Token (for testing)
        console.log("📦 1/5 Deploying Mock Donation Token...");
        const MockToken = await ethers.getContractFactory("MockERC20");
        const donationToken = await MockToken.deploy("Donation Token", "DON", 18);
        await donationToken.waitForDeployment();
        const donationTokenAddr = await donationToken.getAddress();
        console.log("✅ DonationToken:", donationTokenAddr);
        deploymentInfo.contracts.donationToken = donationTokenAddr;

        // 2. Deploy FHEProjectRegistry
        console.log("\n📦 2/5 Deploying FHEProjectRegistry...");
        const ProjectRegistry = await ethers.getContractFactory("FHEProjectRegistry");
        const projectRegistry = await ProjectRegistry.deploy();
        await projectRegistry.waitForDeployment();
        const projectRegistryAddr = await projectRegistry.getAddress();
        console.log("✅ ProjectRegistry:", projectRegistryAddr);
        deploymentInfo.contracts.projectRegistry = projectRegistryAddr;

        // 3. Deploy FHEDonationRound
        console.log("\n📦 3/5 Deploying FHEDonationRound...");
        const DonationRound = await ethers.getContractFactory("FHEDonationRound");
        const donationRound = await DonationRound.deploy();
        await donationRound.waitForDeployment();
        const donationRoundAddr = await donationRound.getAddress();
        console.log("✅ DonationRound:", donationRoundAddr);
        deploymentInfo.contracts.donationRound = donationRoundAddr;

        // 4. Deploy FHEMatchingPool
        console.log("\n📦 4/5 Deploying FHEMatchingPool...");
        const MatchingPool = await ethers.getContractFactory("FHEMatchingPool");
        const matchingPool = await MatchingPool.deploy(donationTokenAddr);
        await matchingPool.waitForDeployment();
        const matchingPoolAddr = await matchingPool.getAddress();
        console.log("✅ MatchingPool:", matchingPoolAddr);
        deploymentInfo.contracts.matchingPool = matchingPoolAddr;

        // 5. Deploy FHEQuadraticFunding (main contract)
        console.log("\n📦 5/5 Deploying FHEQuadraticFunding...");
        const QuadraticFunding = await ethers.getContractFactory("FHEQuadraticFunding");
        const quadraticFunding = await QuadraticFunding.deploy(
            projectRegistryAddr,
            donationRoundAddr,
            matchingPoolAddr,
            deployer.address // Fee recipient
        );
        await quadraticFunding.waitForDeployment();
        const quadraticFundingAddr = await quadraticFunding.getAddress();
        console.log("✅ QuadraticFunding:", quadraticFundingAddr);
        deploymentInfo.contracts.quadraticFunding = quadraticFundingAddr;

        // Configuration
        console.log("\n⚙️  Configuring contracts...");

        // Transfer ownership
        console.log("  - Transferring ownership...");
        await projectRegistry.transferOwnership(quadraticFundingAddr);
        await donationRound.transferOwnership(quadraticFundingAddr);
        await matchingPool.transferOwnership(quadraticFundingAddr);

        // Set platform fee (2.5%)
        console.log("  - Setting platform fee...");
        await quadraticFunding.setPlatformFee(250);

        // Set cooldown (60 seconds)
        console.log("  - Setting donation cooldown...");
        await quadraticFunding.setDonationCooldown(60);

        console.log("✅ Configuration complete!");

        // Save deployment info
        const fs = require("fs");
        const deploymentDir = "./deployments";

        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }

        const deploymentPath = `${deploymentDir}/${hre.network.name}-${Date.now()}.json`;
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

        // Print summary
        console.log("\n" + "=".repeat(60));
        console.log("🎉 DEPLOYMENT SUCCESSFUL!");
        console.log("=".repeat(60));
        console.log("\n📋 Contract Addresses:");
        console.log("─".repeat(60));
        Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
            console.log(`  ${name.padEnd(20)} ${address}`);
        });
        console.log("─".repeat(60));

        console.log("\n📝 Deployment info saved to:", deploymentPath);

        // Frontend .env content
        console.log("\n📄 Add these to your frontend .env file:");
        console.log("─".repeat(60));
        console.log(`VITE_DONATION_TOKEN_ADDRESS=${donationTokenAddr}`);
        console.log(`VITE_PROJECT_REGISTRY_ADDRESS=${projectRegistryAddr}`);
        console.log(`VITE_DONATION_ROUND_ADDRESS=${donationRoundAddr}`);
        console.log(`VITE_MATCHING_POOL_ADDRESS=${matchingPoolAddr}`);
        console.log(`VITE_QUADRATIC_FUNDING_ADDRESS=${quadraticFundingAddr}`);
        console.log(`VITE_CHAIN_ID=${hre.network.config.chainId || "11155111"}`);
        console.log(`VITE_RPC_URL=${process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"}`);
        console.log("─".repeat(60));

        // Important notes
        console.log("\n⚠️  IMPORTANT NOTES:");
        console.log("  1. PROJECT SELECTION is now ENCRYPTED (privacy feature)");
        console.log("  2. Donation amounts are public (ETH transfers are visible)");
        console.log("  3. FHE encryption requires client-side SDK integration");
        console.log("  4. No one can see which project you're voting for!");

        // Etherscan verification command
        if (hre.network.name === "sepolia") {
            console.log("\n🔍 To verify contracts on Etherscan:");
            console.log("─".repeat(60));
            console.log(`npx hardhat verify --network sepolia ${quadraticFundingAddr} \\`);
            console.log(`  ${projectRegistryAddr} \\`);
            console.log(`  ${donationRoundAddr} \\`);
            console.log(`  ${matchingPoolAddr} \\`);
            console.log(`  ${deployer.address}`);
            console.log("─".repeat(60));
        }

    } catch (error) {
        console.error("\n❌ Deployment failed:", error.message);
        throw error;
    }
}

// Execute deployment
main()
    .then(() => {
        console.log("\n✅ Script completed successfully!\n");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Script failed:", error);
        process.exit(1);
    });
