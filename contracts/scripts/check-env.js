#!/usr/bin/env node

/**
 * Pre-deployment environment check script
 * Verifies all required configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 FHE Donations Pre-Deployment Check\n');
console.log('='.repeat(60));

let allChecks = true;

// Check 1: .env file exists
console.log('\n1️⃣  Checking .env file...');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    console.log('   ✅ .env file exists');

    // Read and parse .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim();
        }
    });

    // Check required variables
    const required = [
        'SEPOLIA_RPC_URL',
        'PRIVATE_KEY',
    ];

    required.forEach(key => {
        if (!envVars[key] || envVars[key] === 'YOUR_PRIVATE_KEY_HERE' || envVars[key].includes('YOUR_')) {
            console.log(`   ❌ ${key} not configured`);
            allChecks = false;
        } else {
            console.log(`   ✅ ${key} configured`);
        }
    });

    // Check private key format
    if (envVars.PRIVATE_KEY) {
        if (!envVars.PRIVATE_KEY.startsWith('0x')) {
            console.log('   ⚠️  Private key should start with 0x');
        }
        if (envVars.PRIVATE_KEY.length !== 66) {
            console.log('   ⚠️  Private key should be 66 characters (including 0x)');
        }
    }

} else {
    console.log('   ❌ .env file not found');
    console.log('   💡 Copy .env.example to .env and fill in values');
    allChecks = false;
}

// Check 2: Node modules installed
console.log('\n2️⃣  Checking dependencies...');
const nodeModulesPath = path.join(__dirname, '../node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('   ✅ node_modules exists');

    // Check critical packages
    const criticalPackages = [
        'hardhat',
        '@nomicfoundation/hardhat-toolbox',
        '@openzeppelin/contracts',
        'fhevm'
    ];

    criticalPackages.forEach(pkg => {
        if (fs.existsSync(path.join(nodeModulesPath, pkg))) {
            console.log(`   ✅ ${pkg} installed`);
        } else {
            console.log(`   ❌ ${pkg} missing`);
            allChecks = false;
        }
    });

} else {
    console.log('   ❌ node_modules not found');
    console.log('   💡 Run: npm install');
    allChecks = false;
}

// Check 3: Hardhat config
console.log('\n3️⃣  Checking Hardhat configuration...');
const hardhatConfigPath = path.join(__dirname, '../hardhat.config.js');
if (fs.existsSync(hardhatConfigPath)) {
    console.log('   ✅ hardhat.config.js exists');

    const config = fs.readFileSync(hardhatConfigPath, 'utf8');

    if (config.includes('sepolia')) {
        console.log('   ✅ Sepolia network configured');
    } else {
        console.log('   ❌ Sepolia network not configured');
        allChecks = false;
    }

    if (config.includes('evmVersion')) {
        console.log('   ✅ EVM version set');
    } else {
        console.log('   ⚠️  EVM version not specified');
    }

} else {
    console.log('   ❌ hardhat.config.js not found');
    allChecks = false;
}

// Check 4: Deployment script
console.log('\n4️⃣  Checking deployment scripts...');
const deployScriptPath = path.join(__dirname, 'deploy-simple.js');
if (fs.existsSync(deployScriptPath)) {
    console.log('   ✅ deploy-simple.js exists');
} else {
    console.log('   ❌ deploy-simple.js not found');
    allChecks = false;
}

// Check 5: Contract files
console.log('\n5️⃣  Checking contract files...');
const srcPath = path.join(__dirname, '../src');
const requiredContracts = [
    'FHEDonationBase.sol',
    'FHEDonationRound.sol',
    'FHEMatchingPool.sol',
    'FHEProjectRegistry.sol',
    'FHEQuadraticFunding.sol'
];

requiredContracts.forEach(contract => {
    const contractPath = path.join(srcPath, contract);
    if (fs.existsSync(contractPath)) {
        console.log(`   ✅ ${contract} found`);
    } else {
        console.log(`   ❌ ${contract} not found`);
        allChecks = false;
    }
});

// Check 6: Deployments directory
console.log('\n6️⃣  Checking deployments directory...');
const deploymentsPath = path.join(__dirname, '../deployments');
if (!fs.existsSync(deploymentsPath)) {
    console.log('   ℹ️  Creating deployments directory...');
    fs.mkdirSync(deploymentsPath, { recursive: true });
    console.log('   ✅ Created deployments directory');
} else {
    console.log('   ✅ deployments directory exists');
}

// Final summary
console.log('\n' + '='.repeat(60));
if (allChecks) {
    console.log('✅ All checks passed! Ready to deploy.\n');
    console.log('📝 Next steps:');
    console.log('   1. Ensure you have Sepolia ETH (~0.5 ETH)');
    console.log('   2. Run: npx hardhat run scripts/deploy-simple.js --network sepolia');
    console.log('   3. Save the contract addresses');
    console.log('   4. Update frontend .env with addresses\n');
    process.exit(0);
} else {
    console.log('❌ Some checks failed. Please fix the issues above.\n');
    console.log('💡 Quick fixes:');
    console.log('   - Copy .env.example to .env');
    console.log('   - Fill in your PRIVATE_KEY and SEPOLIA_RPC_URL');
    console.log('   - Run: npm install');
    console.log('   - Ensure contracts are in src/ directory\n');
    process.exit(1);
}
