const hre = require("hardhat");

/**
 * Create a test funding round on Sepolia
 */
async function main() {
  console.log("\n🚀 Creating Test Funding Round on Sepolia...\n");

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

  console.log("📋 Contract address:", QUADRATIC_FUNDING_ADDRESS);

  // Round parameters
  const currentTime = Math.floor(Date.now() / 1000);
  const ONE_HOUR = 3600;
  const ONE_DAY = 86400;
  const ONE_WEEK = ONE_DAY * 7;

  const roundParams = {
    name: "SealedGood Test Round #1",
    startTime: currentTime + ONE_HOUR, // Starts in 1 hour
    endTime: currentTime + ONE_HOUR + ONE_WEEK * 2, // Runs for 2 weeks
    matchingPool: hre.ethers.parseEther("10"), // 10 ETH matching pool
    minDonation: hre.ethers.parseEther("0.001"), // Min 0.001 ETH
    maxDonation: hre.ethers.parseEther("1"), // Max 1 ETH
  };

  console.log("🔧 Round Parameters:");
  console.log("   Name:", roundParams.name);
  console.log("   Start Time:", new Date(roundParams.startTime * 1000).toISOString());
  console.log("   End Time:", new Date(roundParams.endTime * 1000).toISOString());
  console.log("   Matching Pool:", hre.ethers.formatEther(roundParams.matchingPool), "ETH");
  console.log("   Min Donation:", hre.ethers.formatEther(roundParams.minDonation), "ETH");
  console.log("   Max Donation:", hre.ethers.formatEther(roundParams.maxDonation), "ETH");
  console.log("");

  try {
    console.log("📦 Creating round...");
    const tx = await quadraticFunding.createRound(
      roundParams.name,
      roundParams.startTime,
      roundParams.endTime,
      roundParams.matchingPool,
      roundParams.minDonation,
      roundParams.maxDonation
    );

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("\n✅ Round created successfully!");
    console.log("   Transaction hash:", receipt.hash);
    console.log("   Block number:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Try to get the round info
    console.log("\n📊 Fetching round info...");
    const roundInfo = await quadraticFunding.getRoundInfo(1);
    console.log("   Round ID: 1");
    console.log("   Name:", roundInfo.name);
    console.log("   Is Finalized:", roundInfo.isFinalized);

  } catch (error) {
    console.error("\n❌ Error creating round:", error.message);

    // If the error contains more details
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
