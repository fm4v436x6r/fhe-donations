/**
 * FHE Donations Platform - Contract Addresses
 * Network: Sepolia Testnet
 * fhEVM Version: v0.9.1
 * Deployed: 2025-12-06
 *
 * Privacy Model: Project selection is ENCRYPTED, donation amounts are public (ETH transfers)
 * This prevents vote buying, social pressure, and strategic voting based on others' choices
 */

export const CONTRACT_ADDRESSES = {
  // Main contract - orchestrates all other contracts
  QUADRATIC_FUNDING: '0x28E795Cf499CEAcf55b57095d0045Aa7bdB78E95',

  // Component contracts
  PROJECT_REGISTRY: '0xD0188C3873BC065AA9bF8Fa78B8f4BA72c651263',
  DONATION_ROUND: '0x9cEE3c0bb7C12ee470311FCCf30cCc52A2A0345a',
  MATCHING_POOL: '0x784989574A83134a239fa481FAeE4404A688b331',

  // ERC20 Token for donations (legacy - now using native ETH)
  MOCK_USDC: '0xa512c708D60D93b9805296DD0c7998587a1aefFf',
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
  APP_NAME: 'SealedGood',
  APP_DESCRIPTION: 'Privacy-Preserving Quadratic Funding Platform',
  FHE_SDK_VERSION: '0.3.0-5',
} as const;

// Type exports for TypeScript
export type ContractAddresses = typeof CONTRACT_ADDRESSES;
export type NetworkConfig = typeof NETWORK_CONFIG;
export type AppConfig = typeof APP_CONFIG;
