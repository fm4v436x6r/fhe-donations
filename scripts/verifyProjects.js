const hre = require("hardhat");

/**
 * Verify projects directly on ProjectRegistry
 */
async function main() {
  console.log("\n🔐 Verifying Projects on Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  // Contract addresses
  const PROJECT_REGISTRY_ADDRESS = "0x651a9976BC658E68be0C59d267Fdb01EDDa69c9f";

  // Get contract instance
  const projectRegistry = await hre.ethers.getContractAt(
    "FHEProjectRegistry",
    PROJECT_REGISTRY_ADDRESS
  );

  const owner = await projectRegistry.owner();
  console.log("ProjectRegistry owner:", owner);
  console.log("Current account:", deployer.address);
  console.log("Is owner:", owner.toLowerCase() === deployer.address.toLowerCase());

  // Try to verify projects 1, 2, 3
  for (let i = 1; i <= 3; i++) {
    console.log(`\nVerifying project ${i}...`);
    try {
      const tx = await projectRegistry.verifyProject(i, true);
      const receipt = await tx.wait();
      console.log(`   ✅ Project ${i} verified! TX: ${receipt.hash}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Check project status
  console.log("\n📊 Checking project status...");
  for (let i = 1; i <= 3; i++) {
    try {
      const project = await projectRegistry.getProject(i);
      console.log(`Project ${i}: Active=${project.isActive}, Verified=${project.isVerified}`);
    } catch (e) {
      console.log(`Project ${i}: Error - ${e.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
