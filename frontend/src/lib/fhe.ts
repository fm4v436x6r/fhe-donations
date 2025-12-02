import { bytesToHex, getAddress } from "viem";
import type { Address } from "viem";

declare global {
  interface Window {
    RelayerSDK?: any;
    relayerSDK?: any;
    ethereum?: any;
    okxwallet?: any;
  }
}

export interface EncryptedProjectId {
  encryptedProjectId: `0x${string}`;
  proof: `0x${string}`;
}

let fheInstance: any = null;

/**
 * Get the FHE SDK from window (loaded via CDN script tag)
 * Compatible with Relayer SDK 0.3.0-5
 */
const getSDK = () => {
  if (typeof window === "undefined") {
    throw new Error("FHE SDK requires a browser environment");
  }
  const sdk = window.RelayerSDK || window.relayerSDK;
  if (!sdk) {
    throw new Error("Relayer SDK not loaded. Ensure the CDN script tag is present in index.html");
  }
  return sdk;
};

/**
 * Initialize FHE instance with Sepolia network configuration
 * Uses Relayer SDK 0.3.0-5
 */
export const initializeFHE = async (provider?: any) => {
  if (fheInstance) return fheInstance;

  if (typeof window === "undefined") {
    throw new Error("FHE SDK requires a browser environment");
  }

  // Get Ethereum provider - support multiple wallet types
  const ethereumProvider =
    provider || window.ethereum || window.okxwallet?.provider || window.okxwallet;

  if (!ethereumProvider) {
    throw new Error("No wallet provider detected. Connect a wallet first.");
  }

  console.log("🔌 Initializing FHE with Ethereum provider");

  const sdk = getSDK();
  const { initSDK, createInstance, SepoliaConfig } = sdk;

  await initSDK();

  // Use built-in SepoliaConfig from SDK
  const config = { ...SepoliaConfig, network: ethereumProvider };
  fheInstance = await createInstance(config);

  console.log("✅ FHE instance initialized for Sepolia (Relayer SDK 0.3.0-5)");
  return fheInstance;
};

/**
 * Get or create FHE instance
 */
const getInstance = async (provider?: any) => {
  if (fheInstance) return fheInstance;
  return initializeFHE(provider);
};

/**
 * Encrypt project ID for anonymous donation
 * @param projectId - Project ID to encrypt (number, max 2^32-1)
 * @param contractAddress - Target contract address
 * @param userAddress - User's wallet address
 * @param provider - Optional ethereum provider
 * @returns Encrypted project ID and proof
 */
export const encryptProjectId = async (
  projectId: number,
  contractAddress: Address,
  userAddress: Address,
  provider?: any
): Promise<EncryptedProjectId> => {
  try {
    // Validate projectId fits in euint32
    if (projectId > 2 ** 32 - 1 || projectId < 0) {
      throw new Error("Project ID must be between 0 and 4,294,967,295");
    }

    console.log("[FHE] Encrypting project ID:", projectId);

    const instance = await getInstance(provider);
    const contractAddr = getAddress(contractAddress);
    const userAddr = getAddress(userAddress);

    console.log("[FHE] Creating encrypted input for:", {
      contract: contractAddr,
      user: userAddr,
    });

    // Create encrypted input for the contract
    const input = instance.createEncryptedInput(contractAddr, userAddr);
    input.add32(projectId); // euint32 for project ID

    console.log("[FHE] Encrypting input...");
    const { handles, inputProof } = await input.encrypt();
    console.log("[FHE] Encryption complete");

    if (handles.length < 1) {
      throw new Error("FHE SDK returned insufficient handles");
    }

    const encryptedProjectId = bytesToHex(handles[0]) as `0x${string}`;
    const proof = bytesToHex(inputProof) as `0x${string}`;

    console.log("🔐 Project ID encrypted:", {
      projectId,
      encryptedProjectId: encryptedProjectId.slice(0, 20) + "...",
      proof: proof.slice(0, 20) + "...",
    });

    return { encryptedProjectId, proof };
  } catch (error) {
    console.error("❌ Encryption failed:", error);
    throw new Error("Failed to encrypt project selection. Please try again.");
  }
};

/**
 * Format encrypted data for display
 */
export const formatEncrypted = (data: string): string => {
  return "🔒 ***";
};

/**
 * Check if FHE SDK is loaded and ready
 */
export const isFHEReady = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(window.RelayerSDK || window.relayerSDK);
};

/**
 * Check if FHE instance is initialized
 */
export const isFHEInitialized = (): boolean => {
  return fheInstance !== null;
};

/**
 * Wait for FHE SDK to be loaded (with timeout)
 */
export const waitForFHE = async (timeoutMs: number = 10000): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (isFHEReady()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return false;
};

/**
 * Get FHE status for debugging
 */
export const getFHEStatus = (): {
  sdkLoaded: boolean;
  instanceReady: boolean;
} => {
  return {
    sdkLoaded: isFHEReady(),
    instanceReady: fheInstance !== null,
  };
};

/**
 * Preload FHE SDK (call on app initialization)
 * No-op if SDK is loaded via script tag
 */
export const preloadFHE = async (): Promise<void> => {
  try {
    if (isFHEReady()) {
      console.log("✅ FHE SDK already loaded");
    } else {
      console.warn("⚠️ FHE SDK not found. Ensure CDN script tag is present.");
    }
  } catch (error) {
    console.warn("⚠️ FHE SDK preload check failed:", error);
  }
};

// Legacy exports for backward compatibility
export const initFHE = initializeFHE;
export const isFHEAvailable = isFHEInitialized;
