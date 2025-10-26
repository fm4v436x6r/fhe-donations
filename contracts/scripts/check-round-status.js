const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Check round status and display details
 */

async function main() {
  console.log("\n🔍 Checking Round Status...\n");

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
  const donationRoundAddress = deployment.contracts.FHEDonationRound;

  console.log("📋 Donation Round:", donationRoundAddress);

  try {
    // Get contract instance
    const DonationRound = await hre.ethers.getContractFactory("FHEDonationRound");
    const donationRound = DonationRound.attach(donationRoundAddress);

    // Get round ID (assuming round 1)
    const roundId = 1;

    console.log(`\n📊 Checking Round #${roundId}...\n`);

    // Get round details
    const round = await donationRound.rounds(roundId);

    const now = Math.floor(Date.now() / 1000);
    const startTime = Number(round.startTime);
    const endTime = Number(round.endTime);
    const isFinalized = round.isFinalized;
    const matchingPool = Number(round.matchingPool);
    const minDonation = Number(round.minDonation);
    const maxDonation = Number(round.maxDonation);

    console.log("Round Details:");
    console.log("─".repeat(60));
    console.log("Name:", round.name);
    console.log("Description:", round.description);
    console.log("");
    console.log("⏰ Timing:");
    console.log("  Current Time:", new Date(now * 1000).toISOString());
    console.log("  Start Time:  ", new Date(startTime * 1000).toISOString());
    console.log("  End Time:    ", new Date(endTime * 1000).toISOString());
    console.log("");

    // Check status
    const isNotStarted = now < startTime;
    const isActive = now >= startTime && now <= endTime && !isFinalized;
    const isEnded = now > endTime;

    console.log("📍 Status:");
    if (isNotStarted) {
      console.log("  ⏳ NOT STARTED (starts in", Math.floor((startTime - now) / 60), "minutes)");
    } else if (isActive) {
      console.log("  ✅ ACTIVE (ends in", Math.floor((endTime - now) / 60), "minutes)");
    } else if (isEnded && !isFinalized) {
      console.log("  ⏸️  ENDED (not finalized yet)");
    } else if (isFinalized) {
      console.log("  🔒 FINALIZED");
    }
    console.log("");

    console.log("💰 Donations:");
    console.log("  Matching Pool:", hre.ethers.formatUnits(matchingPool, 9), "ETH");
    console.log("  Min Donation: ", hre.ethers.formatUnits(minDonation, 9), "ETH");
    console.log("  Max Donation: ", hre.ethers.formatUnits(maxDonation, 9), "ETH");
    console.log("  Total Projects:", Number(round.totalProjects));
    console.log("");

    // Show donation availability
    console.log("🎯 Can Donate?");
    if (isNotStarted) {
      console.log("  ❌ NO - Round has not started yet");
      console.log("");
      console.log("💡 Solution: Wait for round to start or extend the start time");
      console.log("   Run: npm run extend-round");
    } else if (isEnded) {
      console.log("  ❌ NO - Round has ended");
      console.log("");
      console.log("💡 Solution: Extend the round end time");
      console.log("   Run: npm run extend-round");
    } else if (isFinalized) {
      console.log("  ❌ NO - Round has been finalized");
      console.log("");
      console.log("💡 Solution: Create a new round");
    } else {
      console.log("  ✅ YES - Round is active and accepting donations!");
    }

    console.log("\n" + "─".repeat(60) + "\n");

  } catch (error) {
    console.error("\n❌ Failed:", error.message);
    if (error.message.includes("call revert exception")) {
      console.log("\n💡 This round might not exist yet.");
      console.log("   Please create a round first using the frontend or deployment script.\n");
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
