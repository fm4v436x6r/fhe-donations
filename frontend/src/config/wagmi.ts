import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { APP_CONFIG } from './contracts';

export const config = getDefaultConfig({
  appName: APP_CONFIG.APP_NAME,
  projectId: 'YOUR_PROJECT_ID', // Replace with WalletConnect Project ID from https://cloud.walletconnect.com/
  chains: [sepolia],
  ssr: false,
});
