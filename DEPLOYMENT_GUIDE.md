# FHE Donations Platform - Deployment Guide

## 🎯 Overview

This guide covers deploying the FHE Donations Platform with **fhEVM v0.8.0** to Sepolia testnet and production environments.

**Platform Components:**
- ✅ FHEProjectRegistry - Project registration and management
- ✅ FHEDonationRound - Donation round lifecycle management  
- ✅ FHEMatchingPool - Matching pool funds and distribution
- ✅ FHEQuadraticFunding - Main orchestration contract

**Technology Stack:**
- Solidity 0.8.24
- fhEVM v0.8.0 (@fhevm/solidity)
- Hardhat (viaIR compilation)
- React 18 + TypeScript + Vite
- Zama FHE Relayer SDK v0.2.0

---

## 📋 Prerequisites

### Required Tools
```bash
# Node.js & Package Managers
node >= 18.0.0
npm >= 9.0.0 or yarn >= 1.22.0

# Development Tools
git
curl
```

### Required Accounts & Keys

1. **Wallet Private Key**
   ```bash
   # Generate securely:
   openssl rand -hex 32
   ```
   - ⚠️ **NEVER commit to git!**
   - Fund with testnet ETH (at least 0.5 ETH recommended)

2. **Sepolia Testnet ETH**
   - Get from: https://sepoliafaucet.com/
   - Or: https://www.alchemy.com/faucets/ethereum-sepolia

3. **Etherscan API Key** (for verification)
   - Get from: https://etherscan.io/myapikey

4. **WalletConnect Project ID** (for frontend)
   - Get from: https://cloud.walletconnect.com/

---

## 🔧 Environment Setup

### 1. Clone Repository

```bash
cd /Users/songsu/Desktop/zama/fhe-donations
```

### 2. Install Dependencies

**Contracts:**
```bash
cd contracts
npm install
```

**Frontend:**
```bash
cd ../frontend
yarn install
```

### 3. Configure Environment Variables

**Contracts (`contracts/.env`):**
```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

Required variables:
```env
# Network
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Wallet (NEVER commit!)
PRIVATE_KEY=0xyour_private_key_here

# Verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Gas reporting
REPORT_GAS=true
```

**Frontend (`frontend/.env`):**
```bash
# Copy example file
cp .env.example .env

# Will be updated with deployed contract addresses
```

---

## 🚀 Deployment Process

### Step 1: Compile Contracts

```bash
cd contracts
npm run compile
```

Expected output:
```
✅ Compiled 27 Solidity files successfully (evm target: cancun)
```

### Step 2: Run Tests (Optional but Recommended)

```bash
npm test
```

### Step 3: Deploy to Sepolia

```bash
# Deploy all contracts
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com" npx hardhat run scripts/deploy.js --network sepolia
```

**Deployment order:**
1. FHEProjectRegistry
2. FHEDonationRound  
3. MockERC20 (USDC for testing)
4. FHEMatchingPool
5. FHEQuadraticFunding (main contract)

**Expected output:**
```
🚀 Starting FHE Donations Platform Deployment (fhEVM v0.8.0)...

📝 Deploying with account: 0x...
💰 Account balance: 0.5 ETH

📦 Deploying FHEProjectRegistry...
✅ FHEProjectRegistry deployed to: 0x...

📦 Deploying FHEDonationRound...
✅ FHEDonationRound deployed to: 0x...

📦 Deploying Mock USDC Token...
✅ Mock USDC deployed to: 0x...

📦 Deploying FHEMatchingPool...
✅ FHEMatchingPool deployed to: 0x...

📦 Deploying FHEQuadraticFunding (Main Contract)...
✅ FHEQuadraticFunding deployed to: 0x...

============================================================
🎉 Deployment Complete!
============================================================

📋 Deployed Contracts:

   FHEProjectRegistry:
   0x...

   FHEDonationRound:
   0x...

   MockUSDC:
   0x...

   FHEMatchingPool:
   0x...

   FHEQuadraticFunding:
   0x...

💾 Deployment info saved to:
   contracts/deployments/sepolia-latest.json
```

### Step 4: Verify Contracts on Etherscan

```bash
# Verify FHEProjectRegistry
npx hardhat verify --network sepolia 0xYOUR_PROJECT_REGISTRY_ADDRESS

# Verify FHEDonationRound
npx hardhat verify --network sepolia 0xYOUR_DONATION_ROUND_ADDRESS

# Verify FHEMatchingPool
npx hardhat verify --network sepolia 0xYOUR_MATCHING_POOL_ADDRESS "0xYOUR_TOKEN_ADDRESS"

# Verify FHEQuadraticFunding
npx hardhat verify --network sepolia 0xYOUR_QUADRATIC_FUNDING_ADDRESS \
  "0xPROJECT_REGISTRY" "0xDONATION_ROUND" "0xMATCHING_POOL" "0xFEE_RECIPIENT"
```

### Step 5: Update Frontend Configuration

Edit `frontend/.env`:
```env
VITE_QUADRATIC_FUNDING_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
VITE_PROJECT_REGISTRY_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
VITE_DONATION_ROUND_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
VITE_MATCHING_POOL_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
VITE_MOCK_USDC_ADDRESS=0xYOUR_DEPLOYED_ADDRESS

VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_GATEWAY_URL=https://gateway.sepolia.zama.ai
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Step 6: Test Frontend Locally

```bash
cd frontend
yarn dev
```

Visit http://localhost:8086/ and test:
- ✅ Wallet connection
- ✅ FHE encryption initialization  
- ✅ Project creation
- ✅ Donation encryption

---

## 🌐 Production Deployment

### Frontend Deployment (Vercel)

**Option 1: CLI Deployment**
```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Option 2: GitHub Integration**
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

**Required Vercel Environment Variables:**
```
VITE_QUADRATIC_FUNDING_ADDRESS
VITE_PROJECT_REGISTRY_ADDRESS
VITE_DONATION_ROUND_ADDRESS
VITE_MATCHING_POOL_ADDRESS
VITE_CHAIN_ID=11155111
VITE_RPC_URL
VITE_GATEWAY_URL
VITE_WALLETCONNECT_PROJECT_ID
```

---

## 📊 Post-Deployment Configuration

### Initialize Platform

```javascript
// scripts/initialize.js
const quadraticFunding = await ethers.getContractAt("FHEQuadraticFunding", ADDRESS);

// Set platform parameters
await quadraticFunding.setPlatformFee(250); // 2.5%
await quadraticFunding.setDonationCooldown(60); // 60 seconds
await quadraticFunding.setFeeRecipient(FEE_RECIPIENT_ADDRESS);
```

### Create First Funding Round

```javascript
// Encrypt matching pool amount (e.g., 10 ETH in wei)
const matchingPoolWei = ethers.parseEther("10");

// Create round via UI or script
await quadraticFunding.createRound(
  "Q1 2025 Public Goods Funding",
  startTimestamp,
  endTimestamp,
  encryptedMatchingPoolHandle,
  inputProof,
  ethers.parseEther("0.001"), // min donation
  ethers.parseEther("10") // max donation
);
```

---

## 🔍 Verification & Testing

### Contract Verification Checklist

- [ ] All contracts deployed successfully
- [ ] All contracts verified on Etherscan
- [ ] Contract ownership transferred (if needed)
- [ ] Initial configuration set
- [ ] FHE coprocessor connection working

### Frontend Testing Checklist

- [ ] Wallet connection works (MetaMask, WalletConnect)
- [ ] FHE SDK loads from CDN
- [ ] Encryption works (`encryptDonation()`)
- [ ] Can create projects
- [ ] Can donate with FHE encryption
- [ ] Transaction confirmations display correctly

### Integration Testing

```bash
# Test full donation flow
cd contracts
npx hardhat test test/integration/DonationFlow.test.js --network sepolia
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Stack too deep" compilation error**
```
Solution: Enabled in hardhat.config.js
viaIR: true
```

**2. "FHE SDK not loaded" error**
```
Check: index.html has CDN script
<script src="https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs"></script>
```

**3. "Function cannot be declared as view" error**
```
Solution: Already fixed in v0.8.0 upgrade
FHE operations removed view modifiers
```

**4. "Invalid externalEuint32 handle" error**
```
Check: Frontend is using correct encryption format
const { handles, inputProof } = await input.encrypt();
encryptedAmountHandle = hexlify(handles[0]); // bytes32
```

**5. Gas estimation fails**
```
Increase gas limit manually:
{ gasLimit: 3000000 }
```

---

## 📚 Additional Resources

### Documentation
- **fhEVM v0.8.0 Docs**: https://docs.zama.ai/fhevm
- **Hardhat Docs**: https://hardhat.org/docs
- **Vite Docs**: https://vitejs.dev/

### Support Channels
- **Zama Discord**: https://discord.gg/zama
- **GitHub Issues**: https://github.com/zama-ai/fhevm

### Contract Addresses (Sepolia)
After deployment, update these in README.md:
```
FHEQuadraticFunding: 0x...
FHEProjectRegistry: 0x...
FHEDonationRound: 0x...
FHEMatchingPool: 0x...
```

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Wallet funded with testnet ETH
- [ ] Contracts compiled successfully
- [ ] Contracts deployed to Sepolia
- [ ] Contracts verified on Etherscan
- [ ] Frontend .env updated with addresses
- [ ] Frontend tested locally
- [ ] Frontend deployed to Vercel
- [ ] Production environment variables set
- [ ] Initial platform configuration complete
- [ ] First funding round created (optional)
- [ ] Documentation updated with addresses

---

**Last Updated:** 2025-10-26  
**fhEVM Version:** v0.8.0  
**Platform Version:** 1.0.0
