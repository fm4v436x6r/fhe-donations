const hre = require("hardhat");

/**
 * Create test projects on Sepolia
 */
async function main() {
  console.log("\n🚀 Creating Test Projects on Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Contract addresses from deployment
  const QUADRATIC_FUNDING_ADDRESS = "0x110E812178539Bf7da9Edeeb8c7261700054D34b";

  // Get contract instance
  const quadraticFunding = await hre.ethers.getContractAt(
    "FHEQuadraticFunding",
    QUADRATIC_FUNDING_ADDRESS
  );

  // Test projects metadata (IPFS URIs)
  const testProjects = [
    {
      name: "Privacy-First DEX",
      metadataURI: "ipfs://QmPrivacyDEX123456789",
    },
    {
      name: "FHE Wallet SDK",
      metadataURI: "ipfs://QmFHEWallet123456789",
    },
    {
      name: "Encrypted Voting System",
      metadataURI: "ipfs://QmEncryptedVoting123456789",
    },
  ];

  console.log("📦 Creating projects...\n");

  for (let i = 0; i < testProjects.length; i++) {
    const project = testProjects[i];
    console.log(`Creating project ${i + 1}: ${project.name}`);

    try {
      const tx = await quadraticFunding.registerProject(project.metadataURI);
      const receipt = await tx.wait();

      console.log(`   ✅ Created! TX: ${receipt.hash}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Verify projects by admin
  console.log("🔐 Verifying projects...\n");

  for (let i = 1; i <= testProjects.length; i++) {
    try {
      const tx = await quadraticFunding.verifyProject(i, true);
      await tx.wait();
      console.log(`   ✅ Project ${i} verified`);
    } catch (error) {
      console.log(`   ❌ Error verifying project ${i}: ${error.message}`);
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Total projects created: ${testProjects.length}`);
  console.log(`   Contract: ${QUADRATIC_FUNDING_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
