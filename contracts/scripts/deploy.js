const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy FHE Donations Platform (fhEVM v0.8.0)
 * 
 * Deployment Order:
 * 1. FHEProjectRegistry
 * 2. FHEDonationRound
 * 3. FHEMatchingPool (with ERC20 token)
 * 4. FHEQuadraticFunding (main contract)
 */

async function main() {
  console.log("\n🚀 Starting FHE Donations Platform Deployment (fhEVM v0.8.0)...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  const deployedContracts = {};

  try {
    // ============================================
    // 1. Deploy FHEProjectRegistry
    // ============================================
    console.log("📦 Deploying FHEProjectRegistry...");
    const ProjectRegistry = await hre.ethers.getContractFactory("FHEProjectRegistry");
    const projectRegistry = await ProjectRegistry.deploy();
    await projectRegistry.waitForDeployment();
    const projectRegistryAddress = await projectRegistry.getAddress();
    deployedContracts.FHEProjectRegistry = projectRegistryAddress;
    console.log("✅ FHEProjectRegistry deployed to:", projectRegistryAddress);
    console.log("");

    // ============================================
    // 2. Deploy FHEDonationRound
    // ============================================
    console.log("📦 Deploying FHEDonationRound...");
    const DonationRound = await hre.ethers.getContractFactory("FHEDonationRound");
    const donationRound = await DonationRound.deploy();
    await donationRound.waitForDeployment();
    const donationRoundAddress = await donationRound.getAddress();
    deployedContracts.FHEDonationRound = donationRoundAddress;
    console.log("✅ FHEDonationRound deployed to:", donationRoundAddress);
    console.log("");

    // ============================================
    // 3. Deploy Mock ERC20 Token (for testing)
    // ============================================
    console.log("📦 Deploying Mock USDC Token...");
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    deployedContracts.MockUSDC = mockTokenAddress;
    console.log("✅ Mock USDC deployed to:", mockTokenAddress);
    console.log("");

    // ============================================
    // 4. Deploy FHEMatchingPool
    // ============================================
    console.log("📦 Deploying FHEMatchingPool...");
    const MatchingPool = await hre.ethers.getContractFactory("FHEMatchingPool");
    const matchingPool = await MatchingPool.deploy(mockTokenAddress);
    await matchingPool.waitForDeployment();
    const matchingPoolAddress = await matchingPool.getAddress();
    deployedContracts.FHEMatchingPool = matchingPoolAddress;
    console.log("✅ FHEMatchingPool deployed to:", matchingPoolAddress);
    console.log("");

    // ============================================
    // 5. Deploy FHEQuadraticFunding (Main Contract)
    // ============================================
    console.log("📦 Deploying FHEQuadraticFunding (Main Contract)...");
    const QuadraticFunding = await hre.ethers.getContractFactory("FHEQuadraticFunding");
    const quadraticFunding = await QuadraticFunding.deploy(
      projectRegistryAddress,
      donationRoundAddress,
      matchingPoolAddress,
      deployer.address // fee recipient
    );
    await quadraticFunding.waitForDeployment();
    const quadraticFundingAddress = await quadraticFunding.getAddress();
    deployedContracts.FHEQuadraticFunding = quadraticFundingAddress;
    console.log("✅ FHEQuadraticFunding deployed to:", quadraticFundingAddress);
    console.log("");

    // ============================================
    // Save Deployment Info
    // ============================================
    const deploymentInfo = {
      network: hre.network.name,
      chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      fhevmVersion: "0.8.0",
      contracts: deployedContracts,
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `${hre.network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

    // Also save as latest
    const latestPath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
    fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Deployment Complete!");
    console.log("=".repeat(60));
    console.log("\n📋 Deployed Contracts:\n");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`   ${name}:`);
      console.log(`   ${address}\n`);
    });

    console.log("💾 Deployment info saved to:");
    console.log(`   ${filepath}\n`);

    console.log("📝 Next Steps:");
    console.log("   1. Update frontend/.env with contract addresses");
    console.log("   2. Verify contracts on Etherscan");
    console.log("   3. Configure initial parameters");
    console.log("   4. Test contract interactions\n");

    // Generate .env snippet for frontend
    console.log("=".repeat(60));
    console.log("Frontend .env Configuration:");
    console.log("=".repeat(60));
    console.log(`VITE_QUADRATIC_FUNDING_ADDRESS=${quadraticFundingAddress}`);
    console.log(`VITE_PROJECT_REGISTRY_ADDRESS=${projectRegistryAddress}`);
    console.log(`VITE_DONATION_ROUND_ADDRESS=${donationRoundAddress}`);
    console.log(`VITE_MATCHING_POOL_ADDRESS=${matchingPoolAddress}`);
    console.log(`VITE_MOCK_USDC_ADDRESS=${mockTokenAddress}`);
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
