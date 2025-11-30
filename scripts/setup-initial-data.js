const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Setup Initial Data for FHE Donations Platform
 * - Create a funding round
 * - Register sample projects
 */

async function main() {
  console.log("\n🚀 Setting up initial data for FHE Donations Platform...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Using account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Load deployed contract addresses
  const deploymentsDir = path.join(__dirname, "../deployments");
  const latestPath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);

  if (!fs.existsSync(latestPath)) {
    console.error("❌ No deployment found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(latestPath, "utf8"));
  console.log("📋 Using deployed contracts:\n");
  Object.entries(deployment.contracts).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  console.log("");

  const quadraticFundingAddress = deployment.contracts.FHEQuadraticFunding;
  const projectRegistryAddress = deployment.contracts.FHEProjectRegistry;

  // Get contract instances
  const QuadraticFunding = await hre.ethers.getContractFactory("FHEQuadraticFunding");
  const quadraticFunding = QuadraticFunding.attach(quadraticFundingAddress);

  const ProjectRegistry = await hre.ethers.getContractFactory("FHEProjectRegistry");
  const projectRegistry = ProjectRegistry.attach(projectRegistryAddress);

  try {
    // ============================================
    // 1. Register Sample Projects
    // ============================================
    console.log("📦 Registering sample projects...\n");

    const projects = [
      {
        name: "Clean Water Initiative",
        description: "Providing clean water access to underserved communities through sustainable infrastructure.",
        imageUrl: "https://images.unsplash.com/photo-1541844053589-346841d0b34c?w=800",
        category: "Environment"
      },
      {
        name: "Education for All",
        description: "Building schools and providing educational resources in rural areas.",
        imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
        category: "Education"
      },
      {
        name: "Healthcare Access Project",
        description: "Mobile healthcare clinics serving remote communities with essential medical services.",
        imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800",
        category: "Health"
      }
    ];

    const projectIds = [];

    for (const project of projects) {
      // Create metadata URI (in production, upload to IPFS)
      const metadataURI = `ipfs://metadata/${project.name.toLowerCase().replace(/\s+/g, '-')}`;

      console.log(`   Creating project: ${project.name}`);
      const tx = await quadraticFunding.registerProject(metadataURI);
      const receipt = await tx.wait();

      // Get project ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = quadraticFunding.interface.parseLog(log);
          return parsed.name === 'ProjectRegistered';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = quadraticFunding.interface.parseLog(event);
        const projectId = parsed.args.projectId;
        projectIds.push(projectId);
        console.log(`   ✅ Project #${projectId} created (unverified)\n`);
      }
    }

    // ============================================
    // 2. Funding Round Creation
    // ============================================
    console.log("⚠️  Note: Funding round creation requires proper FHE encryption\n");
    console.log("   To create a round, use the frontend UI which has FHE SDK integrated\n");
    console.log("   Or manually create a round with:\n");
    console.log("   - Round name");
    console.log("   - Start/end times");
    console.log("   - Encrypted matching pool amount (via FHE SDK)\n");

    const roundId = null;

    // ============================================
    // Save Setup Info
    // ============================================
    const setupInfo = {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      projects: projectIds.map((id, index) => ({
        id: id.toString(),
        name: projects[index].name,
        description: projects[index].description,
        category: projects[index].category,
        verified: true
      })),
      roundNote: "Create funding rounds via frontend UI with proper FHE encryption"
    };

    const setupPath = path.join(deploymentsDir, `${hre.network.name}-setup.json`);
    fs.writeFileSync(setupPath, JSON.stringify(setupInfo, null, 2));

    console.log("=" .repeat(60));
    console.log("🎉 Initial Data Setup Complete!");
    console.log("=".repeat(60));
    console.log("\n📋 Summary:\n");
    console.log(`   Projects Created: ${projectIds.length}`);
    projectIds.forEach((id, index) => {
      console.log(`   - Project #${id}: ${projects[index].name}`);
    });
    console.log("\n   Note: Funding rounds should be created via frontend UI\n");

    console.log("💾 Setup info saved to:");
    console.log(`   ${setupPath}\n`);

    console.log("📝 Next Steps:");
    console.log("   1. Create funding rounds via frontend UI (requires FHE SDK)");
    console.log("   2. Test donation flow to created projects");
    console.log("   3. Add matching pool funds to rounds");
    console.log("   4. Monitor round progress and quadratic funding calculations\n");

  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  }
}

// Execute setup
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
