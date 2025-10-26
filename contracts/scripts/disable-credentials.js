const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Disable credential requirement for testing
 * This allows anyone to donate without credentials
 */

async function main() {
  console.log("\n🔓 Disabling credential requirement...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  // Load latest deployment
  const deploymentsDir = path.join(__dirname, "../deployments");
  const latestPath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);

  if (!fs.existsSync(latestPath)) {
    console.error("❌ No deployment found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(latestPath, "utf8"));
  const projectRegistryAddress = deployment.contracts.FHEProjectRegistry;

  console.log("📋 Project Registry:", projectRegistryAddress);

  try {
    // Get contract instance
    const ProjectRegistry = await hre.ethers.getContractFactory("FHEProjectRegistry");
    const projectRegistry = ProjectRegistry.attach(projectRegistryAddress);

    // Disable credential requirement
    console.log("\n🔄 Disabling credential requirement...");
    const tx = await projectRegistry.setCredentialRequirement(false);
    await tx.wait();

    console.log("✅ Credential requirement disabled!");
    console.log("   Transaction hash:", tx.hash);

    // Verify
    const requireCredentials = await projectRegistry.requireCredentials();
    console.log("\n✓ Current status:");
    console.log("   Require Credentials:", requireCredentials);

    console.log("\n🎉 Done! Users can now donate without credentials.\n");

  } catch (error) {
    console.error("\n❌ Failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
