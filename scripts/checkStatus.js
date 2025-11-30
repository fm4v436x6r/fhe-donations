const hre = require("hardhat");

/**
 * Check contract status on Sepolia
 */
async function main() {
  console.log("\n📊 Checking Contract Status on Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Current account:", deployer.address);

  // Contract addresses
  const QUADRATIC_FUNDING_ADDRESS = "0x110E812178539Bf7da9Edeeb8c7261700054D34b";
  const PROJECT_REGISTRY_ADDRESS = "0x651a9976BC658E68be0C59d267Fdb01EDDa69c9f";
  const DONATION_ROUND_ADDRESS = "0x50a50eD771054A4e0Bf0373402fc4A72Da3308B8";

  // Get contract instances
  const quadraticFunding = await hre.ethers.getContractAt(
    "FHEQuadraticFunding",
    QUADRATIC_FUNDING_ADDRESS
  );

  const projectRegistry = await hre.ethers.getContractAt(
    "FHEProjectRegistry",
    PROJECT_REGISTRY_ADDRESS
  );

  const donationRound = await hre.ethers.getContractAt(
    "FHEDonationRound",
    DONATION_ROUND_ADDRESS
  );

  console.log("=".repeat(60));
  console.log("CONTRACT OWNERSHIP");
  console.log("=".repeat(60));

  const qfOwner = await quadraticFunding.owner();
  const prOwner = await projectRegistry.owner();
  const drOwner = await donationRound.owner();

  console.log("QuadraticFunding owner:", qfOwner);
  console.log("ProjectRegistry owner:", prOwner);
  console.log("DonationRound owner:", drOwner);

  console.log("\n" + "=".repeat(60));
  console.log("ROUNDS INFO");
  console.log("=".repeat(60));

  try {
    const roundInfo = await donationRound.getRoundInfo(1);
    console.log("Round 1 exists:");
    console.log("  Name:", roundInfo.name);
    console.log("  Start:", new Date(Number(roundInfo.startTime) * 1000).toISOString());
    console.log("  End:", new Date(Number(roundInfo.endTime) * 1000).toISOString());
    console.log("  Finalized:", roundInfo.isFinalized);
    console.log("  Total Projects:", roundInfo.totalProjects.toString());
    console.log("  Total Donors:", roundInfo.totalDonors.toString());
  } catch (e) {
    console.log("No rounds found or error:", e.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("PROJECTS INFO");
  console.log("=".repeat(60));

  try {
    const projectCount = await projectRegistry.projectCount();
    console.log("Total projects:", projectCount.toString());

    for (let i = 1; i <= Number(projectCount); i++) {
      const project = await projectRegistry.getProject(i);
      console.log(`\nProject ${i}:`);
      console.log("  Owner:", project.owner);
      console.log("  Metadata URI:", project.metadataURI);
      console.log("  Active:", project.isActive);
      console.log("  Verified:", project.isVerified);
    }
  } catch (e) {
    console.log("Error fetching projects:", e.message);
  }

  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
