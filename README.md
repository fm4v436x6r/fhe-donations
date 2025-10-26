# SealedGood

Privacy-Preserving Quadratic Funding Platform powered by Zama's Fully Homomorphic Encryption (FHE)

## 📹 Demo Video

https://github.com/user-attachments/assets/demo-test-vedio.mp4

> **Note**: This demo showcases the **FHE encryption workflow** for private donations. The video demonstrates how donation amounts are encrypted client-side using Zama's FHE technology before being submitted on-chain, ensuring complete privacy throughout the donation process.

## Overview

SealedGood is a decentralized quadratic funding platform that enables completely private donations while maintaining transparent fund allocation. Using Zama's FHE technology, donation amounts remain encrypted throughout the entire lifecycle - from contribution to distribution.

### Key Features

- **🔒 Full Donation Privacy**: All donation amounts remain encrypted on-chain
- **📊 Transparent Allocation**: Quadratic funding calculations performed on encrypted data
- **💰 Matching Pool**: Amplify impact through matching funds
- **⏰ Timed Rounds**: Configure donation rounds with start/end times
- **🎯 Project Registry**: Decentralized project verification
- **💸 Payment Streaming**: Continuous fund distribution to projects

## Technology Stack

### Smart Contracts
- Solidity 0.8.24
- Zama FHE (`fhevm` library)
- OpenZeppelin upgradeable contracts
- Hardhat development environment

### Frontend
- React 18 + TypeScript
- Vite build tool
- shadcn/ui + Ant Design components
- Wagmi v2 + RainbowKit (wallet integration)
- Zama FHE SDK (client-side encryption)

## Quick Start

**Deploy in 5 minutes** - See [QUICK_START.md](QUICK_START.md)

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible wallet
- Sepolia testnet ETH (from faucet)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd fhe-donations

# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

1. **Configure contracts** - `contracts/.env`:
```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

2. **Deploy contracts**:
```bash
cd contracts
npx hardhat run scripts/deploy-simple.js --network sepolia
```

3. **Configure frontend** - `frontend/.env`:
```env
VITE_DONATION_TOKEN_ADDRESS=<deployed_token_address>
VITE_PROJECT_REGISTRY_ADDRESS=<deployed_registry_address>
VITE_DONATION_ROUND_ADDRESS=<deployed_round_address>
VITE_MATCHING_POOL_ADDRESS=<deployed_pool_address>
VITE_QUADRATIC_FUNDING_ADDRESS=<deployed_main_address>
```

4. **Start frontend**:
```bash
cd frontend
npm run dev
```

Visit http://localhost:8081

## Architecture

### Smart Contracts

```
FHEQuadraticFunding (Main Contract)
├── FHEDonationRound (Round Management)
├── FHEMatchingPool (Matching Funds)
├── FHEProjectRegistry (Project Verification)
└── DonationToken (Mock ERC20)
```

#### Core Contracts

**FHEQuadraticFunding** - Main orchestration contract
- Coordinates donations across rounds
- Manages quadratic funding calculations
- Distributes matching pool funds

**FHEDonationRound** - Round lifecycle management
- Create timed donation rounds
- Process encrypted donations
- Track contributor counts per project
- Generate donation receipts

**FHEMatchingPool** - Matching fund management
- Pool contributions from sponsors
- Distribute matching funds to projects
- Payment streaming support

**FHEProjectRegistry** - Project verification
- Register and verify projects
- Track project metadata
- Manage project status

### FHE Integration

All sensitive amounts use Zama's FHE standard pattern:

```solidity
function donate(
    uint256 roundId,
    uint256 projectId,
    einput encryptedAmount,      // FHE encrypted input
    bytes calldata inputProof    // Zero-knowledge proof
) external {
    euint32 amount = TFHE.asEuint32(encryptedAmount, inputProof);
    // Process encrypted donation
}
```

**Frontend encryption**:
```typescript
const input = createEncryptedInput(contractAddress, userAddress);
input.add32(donationAmount); // Encrypt as euint32
const { handles, inputProof } = await input.encrypt();
```

### Key FHE Features

- **Encrypted Amounts**: All donation amounts use `euint32` type
- **Proof Verification**: `einput` + `inputProof` pattern ensures validity
- **Private Calculations**: Quadratic funding math on encrypted values
- **Gateway Decryption**: Async decryption for final results
- **ACL Permissions**: Fine-grained access control

## Security Features

### Fully Homomorphic Encryption
- Donation amounts never decrypted on-chain
- Calculations performed on ciphertext
- Zero-knowledge proofs validate inputs

### Smart Contract Security
- ReentrancyGuard on all state-changing functions
- Access control via Ownable pattern
- Input validation and bounds checking
- Safe math operations using TFHE library

### Frontend Security
- Client-side encryption before transmission
- Secure key management via MetaMask
- Type-safe contract interactions

## Understanding Rounds and Projects

### What are Funding Rounds?

A **Funding Round** is a time-limited fundraising campaign with a dedicated matching pool. Think of it as a seasonal grant program:

- **Time-bounded**: Each round has specific start and end dates
- **Matching Pool**: Contains funds (e.g., 4 ETH) to be distributed among projects
- **Multiple Projects**: Many projects can participate in the same round
- **Quadratic Matching**: The matching pool is distributed using the quadratic funding formula

### What are Projects?

A **Project** is a public good initiative seeking funding. Projects:

- **Register Once**: Created by project owners with metadata (name, description)
- **Join Rounds**: Automatically participate when they receive their first donation in a round
- **Receive Donations**: Accept encrypted contributions from donors
- **Get Matched**: Receive additional funds from the matching pool based on community support

### Relationship Between Rounds and Projects

**One-to-Many Relationship**:
- One round can have many projects (e.g., "Spring 2025" round with 10 projects)
- One project can participate in multiple rounds over time
- Each donation specifies both the round and the project

**Example Flow**:
1. Community creates "Q1 2025" round with 10 ETH matching pool
2. Project "OpenZeppelin SDK" registers on the platform
3. Alice donates 0.1 ETH to OpenZeppelin in Q1 2025 round
4. Bob donates 0.05 ETH to OpenZeppelin in Q1 2025 round
5. OpenZeppelin now participates in Q1 2025 round with 2 donors
6. At round end, OpenZeppelin receives matching funds based on donor count and amounts

## Quadratic Funding Explained

Quadratic Funding (QF) is a democratic way to allocate matching funds:

- **Traditional**: $1 donation = $1 impact
- **Quadratic**: More donors = exponentially more matching funds

**Formula**: `matching = (√donation₁ + √donation₂ + ... + √donationₙ)²`

**Example**:
- Project A: 1 donor gives $100 → Small matching
- Project B: 10 donors give $10 each → Large matching

This prioritizes **community support** over **whale donations**.

### Privacy-Preserving Quadratic Funding

In SealedGood, all quadratic funding calculations are performed on **encrypted donation amounts**:

1. Individual donations remain private throughout the calculation
2. Only the final matching distribution is revealed
3. Prevents donation amount manipulation and gaming
4. Ensures fair distribution based on true community support

## Deployment

See detailed guides:
- **Quick Start**: [QUICK_START.md](QUICK_START.md) - 5-minute deployment
- **Full Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Comprehensive instructions

### Deployment Summary

1. Get Sepolia testnet ETH
2. Configure `contracts/.env`
3. Run pre-deployment check: `node scripts/check-env.js`
4. Deploy contracts: `npx hardhat run scripts/deploy-simple.js --network sepolia`
5. Configure `frontend/.env` with contract addresses
6. Deploy frontend to Vercel

## Documentation

- [Quick Start Guide](QUICK_START.md) - 5-minute deployment
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Comprehensive deployment instructions

## Troubleshooting

### Common Issues

**"Insufficient funds" during deployment**
→ Get more Sepolia ETH from faucets

**"Invalid private key" error**
→ Ensure key starts with `0x` and is 66 characters

**Frontend shows "Connect Wallet" but nothing happens**
→ Switch MetaMask to Sepolia network

**"Amount too large" error**
→ Max donation is 4.3 ETH due to euint32 limit

## License

MIT License

## Acknowledgments

- **Zama**: FHE technology and fhevm library
- **OpenZeppelin**: Secure contract primitives
- **Gitcoin**: Quadratic funding inspiration

---

**Built with privacy. Powered by mathematics. Secured by encryption.**

🔒 SealedGood - Making charitable giving truly confidential