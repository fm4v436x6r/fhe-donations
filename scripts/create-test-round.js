const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("Creating test round...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);

    // FHEDonationRound contract address
    const DONATION_ROUND_ADDRESS = "0x9cEE3c0bb7C12ee470311FCCf30cCc52A2A0345a";

    // Get contract instance
    const donationRound = await ethers.getContractAt("FHEDonationRound", DONATION_ROUND_ADDRESS);

    // Round parameters
    const name = "December 2025 Public Goods Round";
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 60; // Start in 1 minute
    const endTime = now + 7 * 24 * 60 * 60; // End in 7 days
    const minDonation = ethers.parseEther("0.001"); // 0.001 ETH min
    const maxDonation = ethers.parseEther("1.0"); // 1 ETH max

    console.log("Round parameters:");
    console.log("  Name:", name);
    console.log("  Start:", new Date(startTime * 1000).toISOString());
    console.log("  End:", new Date(endTime * 1000).toISOString());
    console.log("  Min donation:", ethers.formatEther(minDonation), "ETH");
    console.log("  Max donation:", ethers.formatEther(maxDonation), "ETH");

    console.log("\nCreating round...");
    const tx = await donationRound.createRound(
        name,
        startTime,
        endTime,
        minDonation,
        maxDonation
    );

    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Get the round ID from nextRoundId
    const nextRoundId = await donationRound.nextRoundId();
    const roundId = Number(nextRoundId) - 1;
    console.log("\n✅ Round created with ID:", roundId);

    // Verify round info
    const roundInfo = await donationRound.getRoundInfo(roundId);
    console.log("\nRound info:");
    console.log("  Name:", roundInfo[0]);
    console.log("  Start time:", new Date(Number(roundInfo[1]) * 1000).toISOString());
    console.log("  End time:", new Date(Number(roundInfo[2]) * 1000).toISOString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
