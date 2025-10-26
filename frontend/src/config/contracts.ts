/**
 * FHE Donations Platform - Contract Addresses
 * Network: Sepolia Testnet
 * fhEVM Version: v0.8.0
 * Deployed: 2025-10-26
 */

export const CONTRACT_ADDRESSES = {
  // Main contract - orchestrates all other contracts
  QUADRATIC_FUNDING: '0x4Ee78112FC303AAC060883Bf71843103809b2b53',

  // Component contracts
  PROJECT_REGISTRY: '0x4271643dd02d242E63a5a5Bd4f0958833234FDbf',
  DONATION_ROUND: '0xC023Ec20EeAe3815Ef57Edf6Ca3C500A5Ab14F33',
  MATCHING_POOL: '0x766848E1428e92Af039bd3010445C813234E8a5E',

  // ERC20 Token for donations
  MOCK_USDC: '0x06709DBf0Dacdb383E36A35326eD1D157CB98558',
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
