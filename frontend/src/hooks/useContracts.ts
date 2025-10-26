/**
 * Custom hooks for reading contract data
 */

import { useReadContract } from 'wagmi';
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
 * Contract ABIs - Only the read functions we need
 */
const PROJECT_REGISTRY_ABI = [
  {
    name: 'nextProjectId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'projects',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'projectId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'owner', type: 'address' },
      { name: 'metadataURI', type: 'string' },
      { name: 'isActive', type: 'bool' },
      { name: 'isVerified', type: 'bool' },
      { name: 'credentialHash', type: 'bytes32' },
      { name: 'createdAt', type: 'uint256' }
    ]
  }
] as const;

const DONATION_ROUND_ABI = [
  {
    name: 'nextRoundId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'rounds',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'name', type: 'string' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'minDonation', type: 'uint256' },
      { name: 'maxDonation', type: 'uint256' },
      { name: 'isFinalized', type: 'bool' }
    ]
  }
] as const;

/**
 * Hook to read the next round ID (total rounds created)
 */
export function useNextRoundId() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.DONATION_ROUND as `0x${string}`,
    abi: DONATION_ROUND_ABI,
    functionName: 'nextRoundId',
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
      staleTime: 5000,
    }
  });
}

/**
 * Hook to read round data by ID
 */
export function useRound(roundId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.DONATION_ROUND as `0x${string}`,
    abi: DONATION_ROUND_ABI,
    functionName: 'rounds',
    args: roundId !== undefined ? [roundId] : undefined,
    query: {
      enabled: roundId !== undefined,
    },
  });
}

/**
 * Hook to read the next project ID (total projects created)
 */
export function useNextProjectId() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.PROJECT_REGISTRY as `0x${string}`,
    abi: PROJECT_REGISTRY_ABI,
    functionName: 'nextProjectId',
  });
}

/**
 * Hook to read project data by ID
 */
export function useProject(projectId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.PROJECT_REGISTRY as `0x${string}`,
    abi: PROJECT_REGISTRY_ABI,
    functionName: 'projects',
    args: projectId !== undefined ? [projectId] : undefined,
    query: {
      enabled: projectId !== undefined,
    },
  });
}

/**
 * Hook to get all rounds
 */
export function useAllRounds() {
  const { data: nextRoundId, isLoading: isLoadingNextId } = useNextRoundId();

  const roundIds = nextRoundId && nextRoundId > 0n
    ? Array.from({ length: Number(nextRoundId) - 1 }, (_, i) => BigInt(i + 1))
    : [];

  return {
    roundIds,
    isLoading: isLoadingNextId,
    totalRounds: nextRoundId ? Number(nextRoundId) - 1 : 0,
  };
}

/**
 * Hook to get all projects
 */
export function useAllProjects() {
  const { data: nextProjectId, isLoading: isLoadingNextId } = useNextProjectId();

  const projectIds = nextProjectId && nextProjectId > 0n
    ? Array.from({ length: Number(nextProjectId) - 1 }, (_, i) => BigInt(i + 1))
    : [];

  return {
    projectIds,
    isLoading: isLoadingNextId,
    totalProjects: nextProjectId ? Number(nextProjectId) - 1 : 0,
  };
}
