/**
 * Custom hook for accessing contract addresses and configurations
 * All addresses are hardcoded from deployed contracts
 */

import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config';

/**
 * Hook to get all contract addresses
 * @returns Contract addresses object
 */
export function useContractAddresses() {
  return CONTRACT_ADDRESSES;
}

/**
 * Hook to get network configuration
 * @returns Network config object
 */
export function useNetworkConfig() {
  return NETWORK_CONFIG;
}

/**
 * Hook to get FHE Gateway URL
 * @returns Gateway URL string
 */
export function useFHEGateway() {
  return NETWORK_CONFIG.FHE_GATEWAY_URL;
}

/**
 * Example usage:
 *
 * ```typescript
 * import { useContractAddresses } from '@/hooks/useContracts';
 *
 * function MyComponent() {
 *   const { QUADRATIC_FUNDING, MOCK_USDC } = useContractAddresses();
 *
 *   // Use contract address
 *   const contract = useContract({
 *     address: QUADRATIC_FUNDING,
 *     abi: QuadraticFundingABI,
 *   });
 * }
 * ```
 */
