/**
 * FHE Donations Platform - Contract Addresses
 * Network: Sepolia Testnet
 * fhEVM Version: v0.8.0
 * Deployed: 2025-10-26
 */

export const CONTRACT_ADDRESSES = {
  // Main contract - orchestrates all other contracts
  QUADRATIC_FUNDING: '0x110E812178539Bf7da9Edeeb8c7261700054D34b',

  // Component contracts
  PROJECT_REGISTRY: '0x651a9976BC658E68be0C59d267Fdb01EDDa69c9f',
  DONATION_ROUND: '0x50a50eD771054A4e0Bf0373402fc4A72Da3308B8',
  MATCHING_POOL: '0xdd830C0A2e39eA986433761eD4716C979D056AD4',

  // ERC20 Token for donations
  MOCK_USDC: '0xed9577054D8916c1460fddC972249eE6646E4e0D',
} as const;

export const NETWORK_CONFIG = {
  CHAIN_ID: 11155111, // Sepolia
  NETWORK_NAME: 'Sepolia',
  RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com',
  BLOCK_EXPLORER: 'https://sepolia.etherscan.io',

  // Zama FHE Gateway (v0.8.0)
  FHE_GATEWAY_URL: 'https://gateway.sepolia.zama.ai',
} as const;

export const APP_CONFIG = {
  APP_NAME: 'Shield Fund',
  APP_DESCRIPTION: 'Privacy-Preserving Quadratic Funding Platform',
  FHE_SDK_VERSION: '0.2.0',
} as const;

// Type exports for TypeScript
export type ContractAddresses = typeof CONTRACT_ADDRESSES;
export type NetworkConfig = typeof NETWORK_CONFIG;
export type AppConfig = typeof APP_CONFIG;
