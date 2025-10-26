# Shield Fund - FHE Donations Frontend

Privacy-preserving donation and quadratic funding platform built with Zama FHE technology.

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui (Radix UI) + Tailwind CSS + Ant Design components
- **Web3**: Wagmi v2 + RainbowKit
- **FHE**: Zama FHE SDK (fhevmjs)
- **State**: Zustand

## Features

- 🔒 **Full Privacy**: Donations encrypted with FHE
- 🎯 **Quadratic Funding**: Democratic fund allocation
- 🌐 **Web3 Wallet**: Connect via RainbowKit
- 📱 **Responsive**: Mobile-first design
- ⚡ **Fast**: Built with Vite

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create `.env` file:

```env
VITE_MARKET_CORE_ADDRESS=0x...
VITE_DONATION_ROUND_ADDRESS=0x...
VITE_MATCHING_POOL_ADDRESS=0x...
VITE_PROJECT_REGISTRY_ADDRESS=0x...
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_GATEWAY_URL=https://gateway.sepolia.zama.ai
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── lib/            # Utilities (FHE, utils)
├── stores/         # Zustand stores
├── types/          # TypeScript types
└── config/         # Configuration (wagmi)
```

## Key Pages

- **Home**: Browse active funding rounds
- **RoundDetail**: View projects in a round
- **ProjectDetail**: Project info + donate
- **MyDonations**: User donation history
- **CreateProject**: Register new project
- **Admin**: Round management (owner only)

## FHE Integration

All donations are encrypted client-side using Zama FHE SDK:

```typescript
import { encryptDonation } from '@/lib/fhe'

// Encrypt before sending to contract
const { encryptedAmount, proof } = await encryptDonation(
  amountWei,
  contractAddress,
  userAddress
)
```

## Deployment

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

Deploy the `dist/` folder to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting

## Development

- ESLint for code quality
- TypeScript for type safety
- Hot module replacement (HMR)

## License

MIT
