const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("Creating test project and registering to round...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);

    // Contract addresses
    const PROJECT_REGISTRY_ADDRESS = "0xD0188C3873BC065AA9bF8Fa78B8f4BA72c651263";
    const DONATION_ROUND_ADDRESS = "0x9cEE3c0bb7C12ee470311FCCf30cCc52A2A0345a";

    // Get contract instances
    const projectRegistry = await ethers.getContractAt("FHEProjectRegistry", PROJECT_REGISTRY_ADDRESS);
    const donationRound = await ethers.getContractAt("FHEDonationRound", DONATION_ROUND_ADDRESS);

    // Create project metadata
    const metadata = {
        name: "Privacy Protocol Development",
        description: "Building open-source FHE tools for Web3 privacy. Our project focuses on making homomorphic encryption accessible to all developers.",
        image: "https://placehold.co/400x300/3b82f6/white?text=Privacy+Protocol"
    };
    
    const metadataURI = "data:application/json;base64," + Buffer.from(JSON.stringify(metadata)).toString('base64');

    console.log("Creating project...");
    console.log("  Name:", metadata.name);
    
    const tx1 = await projectRegistry.registerProject(metadataURI);
    console.log("Transaction hash:", tx1.hash);
    const receipt1 = await tx1.wait();
    console.log("Transaction confirmed in block:", receipt1.blockNumber);

    // Get project ID
    const nextProjectId = await projectRegistry.nextProjectId();
    const projectId = Number(nextProjectId) - 1;
    console.log("\n✅ Project created with ID:", projectId);

    // Register project to round 1
    console.log("\nRegistering project to round 1...");
    const tx2 = await donationRound.registerProject(1, projectId);
    console.log("Transaction hash:", tx2.hash);
    const receipt2 = await tx2.wait();
    console.log("Transaction confirmed in block:", receipt2.blockNumber);
    console.log("\n✅ Project registered to round 1");

    // Create another project
    const metadata2 = {
        name: "ZK Education Platform",
        description: "Free educational resources for learning zero-knowledge proofs and privacy technology in blockchain.",
        image: "https://placehold.co/400x300/10b981/white?text=ZK+Education"
    };
    
    const metadataURI2 = "data:application/json;base64," + Buffer.from(JSON.stringify(metadata2)).toString('base64');

    console.log("\nCreating second project...");
    console.log("  Name:", metadata2.name);
    
    const tx3 = await projectRegistry.registerProject(metadataURI2);
    await tx3.wait();
    const projectId2 = Number(await projectRegistry.nextProjectId()) - 1;
    console.log("✅ Project created with ID:", projectId2);

    // Register to round
    const tx4 = await donationRound.registerProject(1, projectId2);
    await tx4.wait();
    console.log("✅ Project registered to round 1");

    console.log("\n=== Summary ===");
    console.log("Round ID: 1");
    console.log("Project IDs:", projectId, ",", projectId2);
    console.log("\nYou can now donate to these projects at https://sealedgood.vercel.app");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
