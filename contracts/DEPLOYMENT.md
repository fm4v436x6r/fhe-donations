# FHE Donations Platform - Deployment Guide

## Prerequisites

1. Node.js v16+ and npm/yarn
2. Hardhat development environment
3. Access to Zama's fhEVM network or testnet
4. Funded wallet for deployment

## Installation

```bash
cd contracts
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
   - RPC URLs for your target networks
   - Private keys for deployment
   - API keys for verification

## Compilation

```bash
npm run compile
```

## Testing

Run the test suite:
```bash
npm test
```

Run with gas reporting:
```bash
REPORT_GAS=true npm test
```

## Deployment

### Local Development
```bash
npx hardhat node
npm run deploy
```

### Testnet (Sepolia)
```bash
npm run deploy:sepolia
```

### Zama DevNet
```bash
npx hardhat run scripts/deploy.js --network zama
```

## Contract Addresses

After deployment, contract addresses will be saved to `deployments/{network}.json`.

## Verification

To verify contracts on Etherscan:
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS "constructor" "arguments"
```

## Contract Architecture

### Core Contracts

1. **FHEDonationBase.sol**
   - Base contract with FHE utilities
   - Safe arithmetic operations
   - Access control and security features

2. **FHEProjectRegistry.sol**
   - Project registration and management
   - Anti-sybil credential system
   - Project verification

3. **FHEDonationRound.sol**
   - Round lifecycle management
   - Encrypted donation tracking
   - Quadratic funding calculations

4. **FHEMatchingPool.sol**
   - Matching pool management
   - Streaming donations
   - Controlled revelation

5. **FHEQuadraticFunding.sol**
   - Main orchestration contract
   - Integration of all components
   - User-facing interface

### FHE Operations

All sensitive data (donation amounts, matching pools) are encrypted using Zama's fhEVM:

- **Encrypted Types**: euint32 for amounts
- **Operations**: Safe arithmetic with overflow protection
- **Square Root**: Newton-Raphson approximation for QF
- **Batch Processing**: Gas-efficient bulk operations

### Security Features

1. **Access Control**: Role-based permissions
2. **Pausable**: Emergency pause mechanism
3. **ReentrancyGuard**: Protection against reentrancy
4. **Anti-Sybil**: Credential-based verification
5. **Cooldowns**: Rate limiting for donations

## Gas Optimization

The contracts implement several gas optimization strategies:

1. Batch operations for multiple donations
2. Efficient storage patterns
3. Optimized FHE operations
4. Minimal on-chain computation

## Upgradeability

The contracts are designed to be upgradeable using proxy patterns if needed. The main contract can update references to sub-contracts.

## Monitoring

Key events to monitor:
- `ProjectRegistered`
- `DonationMade`
- `RoundCreated`
- `RoundFinalized`
- `MatchingDistributed`

## Support

For issues or questions about deployment, please refer to:
- [Zama Documentation](https://docs.zama.ai)
- [Contract Tests](./test/FHEDonation.test.js)
- GitHub Issues