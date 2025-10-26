# Contract Addresses

All contract addresses are **hardcoded** in the frontend configuration for production deployment.

## Deployed Contracts (Sepolia Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| **FHEQuadraticFunding** | `0x4Ee78112FC303AAC060883Bf71843103809b2b53` | [View](https://sepolia.etherscan.io/address/0x4Ee78112FC303AAC060883Bf71843103809b2b53) |
| **FHEProjectRegistry** | `0x4271643dd02d242E63a5a5Bd4f0958833234FDbf` | [View](https://sepolia.etherscan.io/address/0x4271643dd02d242E63a5a5Bd4f0958833234FDbf) |
| **FHEDonationRound** | `0xC023Ec20EeAe3815Ef57Edf6Ca3C500A5Ab14F33` | [View](https://sepolia.etherscan.io/address/0xC023Ec20EeAe3815Ef57Edf6Ca3C500A5Ab14F33) |
| **FHEMatchingPool** | `0x766848E1428e92Af039bd3010445C813234E8a5E` | [View](https://sepolia.etherscan.io/address/0x766848E1428e92Af039bd3010445C813234E8a5E) |
| **MockUSDC** | `0x06709DBf0Dacdb383E36A35326eD1D157CB98558` | [View](https://sepolia.etherscan.io/address/0x06709DBf0Dacdb383E36A35326eD1D157CB98558) |

## Configuration Files

### Primary Configuration
All contract addresses are defined in:
```typescript
frontend/src/config/contracts.ts
```

This file exports:
- `CONTRACT_ADDRESSES` - All deployed contract addresses
- `NETWORK_CONFIG` - Network settings (Chain ID, RPC, Gateway URL)
- `APP_CONFIG` - Application metadata

### Usage in Components

#### Option 1: Direct Import
```typescript
import { CONTRACT_ADDRESSES } from '@/config';

// Use in your component
const contractAddress = CONTRACT_ADDRESSES.QUADRATIC_FUNDING;
```

#### Option 2: Using Custom Hook
```typescript
import { useContractAddresses } from '@/hooks/useContracts';

function MyComponent() {
  const { QUADRATIC_FUNDING, MOCK_USDC } = useContractAddresses();

  // Use addresses...
}
```

#### Option 3: Using with wagmi
```typescript
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config';
import { QuadraticFundingABI } from '@/contracts/abis';

function MyComponent() {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESSES.QUADRATIC_FUNDING,
    abi: QuadraticFundingABI,
    functionName: 'getRound',
    args: [1],
  });
}
```

## Network Information

- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: https://ethereum-sepolia-rpc.publicnode.com
- **Block Explorer**: https://sepolia.etherscan.io
- **FHE Gateway**: https://gateway.sepolia.zama.ai
- **fhEVM Version**: v0.8.0

## Environment Variables

The `.env` file is **optional** for production deployment since all addresses are hardcoded.

However, you still need to set:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get your WalletConnect Project ID from: https://cloud.walletconnect.com/

## Deployment Information

- **Deployed**: 2025-10-26
- **Deployer**: 0x74B96c18B96251e4824BA06330c60C9a334382Ba
- **Deployment File**: `contracts/deployments/sepolia-latest.json`

## Updating Contract Addresses

If contracts are redeployed, update addresses in:
1. `frontend/src/config/contracts.ts` - Primary configuration
2. `frontend/.env` - Optional, for local development
3. This file - Documentation

## Testing

To verify contract addresses are correct:

```bash
# Start development server
yarn dev

# Check browser console for contract initialization
# Should see: "✅ Contract addresses loaded"
```

## Production Deployment

When deploying to Vercel:

1. **No environment variables needed** for contract addresses (hardcoded)
2. **Required environment variable**:
   - `VITE_WALLETCONNECT_PROJECT_ID`
3. Build command: `yarn build`
4. Output directory: `dist`

All contract addresses will be bundled into the production build.
