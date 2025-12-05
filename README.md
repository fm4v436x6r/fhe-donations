# SealedGood

**Privacy-Preserving Quadratic Funding with Fully Homomorphic Encryption**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue)](https://docs.soliditylang.org)
[![fhEVM](https://img.shields.io/badge/fhEVM-0.9.1-purple)](https://docs.zama.ai/fhevm)
[![Network](https://img.shields.io/badge/Network-Sepolia-green)](https://sepolia.etherscan.io)
[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://sealedgood.vercel.app)

---

## Project Vision

**SealedGood** reimagines quadratic funding by solving a fundamental problem: **transparent voting enables manipulation**.

In traditional quadratic funding platforms, all donation amounts and project choices are publicly visible on-chain. This transparency, while well-intentioned, creates serious vulnerabilities:

- **Vote Buying**: Bad actors can pay donors to support specific projects, verifying compliance through public transaction data
- **Social Pressure**: Donors may vote based on social expectations rather than genuine preferences
- **Strategic Voting**: Donors can game the system by analyzing others' contributions in real-time
- **Whale Influence**: Large donors can signal their preferences, influencing smaller donors

### Our Solution: Encrypted Project Selection

SealedGood uses **Zama's Fully Homomorphic Encryption (FHE)** to encrypt the most critical piece of information: **which project each donation supports**.

| Data Type | Visibility | Rationale |
|-----------|------------|-----------|
| **Project Selection** | Encrypted | Prevents vote buying, social pressure, and strategic voting |
| **Donation Amount** | Public | ETH transfers are inherently visible; transparency on amounts is acceptable |
| **Donor Address** | Public | Required for blockchain transactions |
| **Aggregated Totals** | Revealed after round ends | Enables fair quadratic funding distribution |

This design achieves **privacy where it matters most** while maintaining the transparency needed for trust in public goods funding.

---

## Live Demo

**Production**: [https://sealedgood.vercel.app](https://sealedgood.vercel.app)

**Network**: Ethereum Sepolia Testnet

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Interface                                 │
│                    React + TypeScript + Ant Design                       │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│    │  Browse     │  │  Donate     │  │  Create     │  │    My       │  │
│    │  Rounds     │  │  (FHE)      │  │  Projects   │  │  Donations  │  │
│    └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Zama Relayer SDK      │
                    │   Client-Side FHE       │
                    │   Encryption            │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                        Smart Contract Layer                              │
│                         Sepolia Testnet                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    FHEQuadraticFunding                              │ │
│  │                    Main Orchestrator                                │ │
│  │  • Coordinates all contract interactions                           │ │
│  │  • Manages platform fees and cooldowns                             │ │
│  │  • Owner-controlled admin functions                                │ │
│  └──────────────────────────┬─────────────────────────────────────────┘ │
│                             │                                            │
│         ┌───────────────────┼───────────────────┐                       │
│         │                   │                   │                       │
│         ▼                   ▼                   ▼                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │
│  │ FHEProjectRegistry│ │ FHEDonationRound │ │ FHEMatchingPool │           │
│  │                 │ │                 │ │                 │           │
│  │ • Register      │ │ • Create Rounds │ │ • Collect Funds │           │
│  │ • Verify        │ │ • Accept Donations│ │ • QF Calculation│           │
│  │ • Metadata      │ │ • FHE Storage   │ │ • Distribution  │           │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘           │
│                             │                                            │
│                    ┌────────▼────────┐                                  │
│                    │ FHEDonationBase │                                  │
│                    │ Common Logic    │                                  │
│                    │ • Pausable      │                                  │
│                    │ • ReentrancyGuard│                                  │
│                    │ • FHE Helpers   │                                  │
│                    └─────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### FHE Encryption Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     Donation Process                              │
└──────────────────────────────────────────────────────────────────┘

1. User selects project and enters donation amount
   │
   ▼
2. Client-side FHE encryption (Zama Relayer SDK)
   ┌─────────────────────────────────────────┐
   │  const input = instance.createEncryptedInput()  │
   │  input.add32(projectId)                 │  ← Project ID encrypted!
   │  const { handles, inputProof } = await input.encrypt()  │
   └─────────────────────────────────────────┘
   │
   ▼
3. Submit transaction with encrypted projectId + public ETH amount
   ┌─────────────────────────────────────────┐
   │  donate(roundId, encryptedProjectId, proof)  │
   │  { value: donationAmount }              │  ← Amount is public (ETH)
   └─────────────────────────────────────────┘
   │
   ▼
4. Contract stores encrypted data
   ┌─────────────────────────────────────────┐
   │  euint32 projectId = FHE.fromExternal(...)  │
   │  // Stored encrypted on-chain           │
   │  // No one knows which project!         │
   └─────────────────────────────────────────┘
   │
   ▼
5. After round ends: Tally using FHE operations
   ┌─────────────────────────────────────────┐
   │  // For each donation:                  │
   │  ebool isMatch = FHE.eq(encryptedProjId, targetProj)  │
   │  euint32 toAdd = FHE.select(isMatch, amount, 0)  │
   │  projectTotal = FHE.add(projectTotal, toAdd)  │
   └─────────────────────────────────────────┘
```

---

## Deployed Contracts (Sepolia)

| Contract | Address | Description |
|----------|---------|-------------|
| **FHEQuadraticFunding** | `0x28E795Cf499CEAcf55b57095d0045Aa7bdB78E95` | Main orchestrator |
| **FHEProjectRegistry** | `0xD0188C3873BC065AA9bF8Fa78B8f4BA72c651263` | Project management |
| **FHEDonationRound** | `0x9cEE3c0bb7C12ee470311FCCf30cCc52A2A0345a` | Round & donation handling |
| **FHEMatchingPool** | `0x784989574A83134a239fa481FAeE4404A688b331` | Matching pool distribution |
| **MockUSDC** | `0xa512c708D60D93b9805296DD0c7998587a1aefFf` | Test token (legacy) |

---

## Technology Stack

### Smart Contract Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | 0.8.28 | Smart contract language |
| **fhEVM** | 0.9.1 | Fully Homomorphic Encryption for EVM |
| **Hardhat** | 2.22.x | Development & testing framework |
| **OpenZeppelin** | 5.4.0 | Security patterns (Ownable, Pausable, ReentrancyGuard) |
| **fhevm-hardhat-plugin** | 0.3.0-1 | FHE testing utilities |

### Frontend Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.x | UI framework |
| **TypeScript** | 5.8.x | Type-safe development |
| **Vite** | 5.4.x | Build tool & dev server |
| **wagmi** | 2.18.x | React hooks for Ethereum |
| **viem** | 2.38.x | TypeScript Ethereum library |
| **Ant Design** | 5.27.x | UI component library |
| **TailwindCSS** | 3.4.x | Utility-first CSS |
| **Zustand** | 5.0.x | State management |
| **Zama Relayer SDK** | 0.3.0-5 | Client-side FHE encryption |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting |
| **Sepolia Testnet** | Ethereum test network |
| **Zama FHE Gateway** | FHE decryption service |

---

## Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **npm** v10 or higher
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH** for testing ([Faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone repository
git clone <repository-url>
cd sealedgood

# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

### Environment Configuration

Create `.env` in the root directory:

```env
# Required for deployment
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_private_key_here

# Optional
REPORT_GAS=true
```

---

## Smart Contract Development

### Compile Contracts

```bash
npm run compile
```

### Run Unit Tests

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:registry    # FHEProjectRegistry tests
npm run test:round       # FHEDonationRound tests
npm run test:pool        # FHEMatchingPool tests
npm run test:qf          # FHEQuadraticFunding tests
```

### Test Coverage

The test suite covers:

| Test File | Coverage |
|-----------|----------|
| `FHEProjectRegistry.test.js` | Project registration, verification, metadata |
| `FHEDonationRound.test.js` | Round creation, donations, finalization |
| `FHEMatchingPool.test.js` | Pool management, distribution |
| `FHEQuadraticFunding.test.js` | Integration tests, QF calculations |
| `FHEDonation.test.js` | End-to-end donation flow |

### Deploy to Sepolia

```bash
# Deploy all contracts
npm run deploy:sepolia

# The script will output:
# - Contract addresses
# - Configuration for frontend
# - Etherscan verification commands
```

### Verify on Etherscan

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## Frontend Development

### Start Development Server

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

### Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx        # Main layout wrapper
│   │   ├── EncryptedBadge.tsx # FHE indicator
│   │   └── ui/               # shadcn/ui components
│   ├── pages/            # Route pages
│   │   ├── Home.tsx          # Landing page
│   │   ├── Rounds.tsx        # Browse funding rounds
│   │   ├── RoundDetail.tsx   # Single round view
│   │   ├── ProjectDetail.tsx # Donation page (FHE)
│   │   ├── CreateRound.tsx   # Create new round
│   │   ├── CreateProject.tsx # Register project
│   │   └── MyDonations.tsx   # User donation history
│   ├── lib/              # Utilities
│   │   └── fhe.ts            # FHE encryption helpers
│   ├── config/           # Configuration
│   │   ├── contracts.ts      # Contract addresses
│   │   └── wagmi.ts          # Wallet configuration
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript types
└── index.html            # Entry point with FHE SDK
```

---

## Quadratic Funding Explained

Quadratic Funding (QF) is a mechanism that amplifies small donations through matching funds:

### The Formula

```
Matching = (√d₁ + √d₂ + √d₃ + ... + √dₙ)² - (d₁ + d₂ + d₃ + ... + dₙ)
```

### Why It Matters

| Scenario | Total Donated | Matching (Simplified) |
|----------|--------------|----------------------|
| 1 donor gives 100 ETH | 100 ETH | Low matching |
| 100 donors give 1 ETH each | 100 ETH | **High matching** |

Quadratic funding prioritizes **community breadth** over **individual wealth**.

### Privacy Enhancement

In SealedGood, **project selection is encrypted**, preventing:

1. **Vote buying verification** - Buyers can't confirm donors voted as promised
2. **Social pressure** - No one sees your choices until results are published
3. **Strategic voting** - Can't game based on real-time voting data

---

## Security Considerations

### Cryptographic Security

- **FHE Encryption**: Project IDs encrypted with Zama's fhEVM
- **Client-Side Encryption**: Data encrypted before leaving user's device
- **Zero-Knowledge Proofs**: Input validation without revealing values

### Smart Contract Security

- **OpenZeppelin Patterns**: Ownable, Pausable, ReentrancyGuard
- **Input Validation**: Comprehensive checks on all parameters
- **Access Control**: Owner-only functions for admin operations
- **Emergency Pause**: Contract can be paused if issues detected

### Known Limitations

- **Amount Visibility**: ETH transfer amounts are public (blockchain limitation)
- **Timing Attacks**: Transaction timing could reveal patterns
- **Gas Costs**: FHE operations are more expensive than plaintext

---

## Available Scripts

### Contract Development

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile Solidity contracts |
| `npm run test` | Run all unit tests |
| `npm run test:registry` | Test FHEProjectRegistry |
| `npm run test:round` | Test FHEDonationRound |
| `npm run test:pool` | Test FHEMatchingPool |
| `npm run test:qf` | Test FHEQuadraticFunding |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |
| `npm run clean` | Clean build artifacts |

### Frontend Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## Resources

### Documentation

- [Zama fhEVM Documentation](https://docs.zama.ai/fhevm)
- [fhEVM GitHub Repository](https://github.com/zama-ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)

### Quadratic Funding

- [Gitcoin: WTF is Quadratic Funding](https://wtfisqf.com/)
- [Vitalik Buterin on QF](https://vitalik.ca/general/2019/12/07/quadratic.html)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with Zama's fhEVM**

*Bringing privacy to public goods funding through Fully Homomorphic Encryption*
