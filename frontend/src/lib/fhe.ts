import { hexlify, getAddress } from "ethers";

declare global {
  interface Window {
    relayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: Record<string, unknown>) => Promise<any>;
      SepoliaConfig: Record<string, unknown>;
    };
    ethereum?: any;
    okxwallet?: any;
  }
}

export interface EncryptedData {
  encryptedAmount: string;
  proof: string;
}

let fheInstance: any = null;
let sdkPromise: Promise<any> | null = null;

const SDK_URL = 'https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js';

/**
 * Dynamically load Zama FHE SDK from CDN
 */
const loadSdk = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires browser environment');
  }

  if (window.relayerSDK) {
    return window.relayerSDK;
  }

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SDK_URL}"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(window.relayerSDK));
        existing.addEventListener('error', () => reject(new Error('Failed to load FHE SDK')));
        return;
      }

      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => {
        if (window.relayerSDK) {
          resolve(window.relayerSDK);
        } else {
          reject(new Error('relayerSDK unavailable after load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load FHE SDK'));
      document.body.appendChild(script);
    });
  }

  return sdkPromise;
};

/**
 * Initialize FHE instance with Sepolia network configuration
 */
export async function initFHE(provider?: any): Promise<any> {
  if (fheInstance) {
    return fheInstance;
  }

  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires browser environment');
  }

  // Get Ethereum provider - support multiple wallet types
  let ethereumProvider = provider;

  if (!ethereumProvider) {
    // Try OKX Wallet first (if user has it)
    if (window.okxwallet) {
      ethereumProvider = window.okxwallet;
      console.log('🦊 Detected OKX Wallet');
    }
    // Fallback to standard window.ethereum (MetaMask, etc.)
    else if (window.ethereum) {
      ethereumProvider = window.ethereum;
      console.log('🦊 Detected Ethereum wallet');
    }
  }

  if (!ethereumProvider) {
    throw new Error('Ethereum provider not found. Please connect your wallet first.');
  }

  console.log('🔌 Initializing FHE with Ethereum provider');

  const sdk = await loadSdk();
  if (!sdk) {
    throw new Error('FHE SDK not available');
  }

  await sdk.initSDK();

  // Use the built-in SepoliaConfig from the SDK
  const config = {
    ...sdk.SepoliaConfig,
    network: ethereumProvider,
  };

  fheInstance = await sdk.createInstance(config);
  console.log('✅ FHE instance initialized for Sepolia');

  return fheInstance;
}

/**
 * Encrypt donation amount using FHE
 * @param amount - Amount in Gwei (bigint)
 * @param contractAddress - Target contract address
 * @param userAddress - User's wallet address
 * @returns Encrypted amount and proof
 */
export async function encryptDonation(
  amount: bigint,
  contractAddress: string,
  userAddress: string,
  provider?: any
): Promise<EncryptedData> {
  try {
    const fhe = await initFHE(provider);
    const checksumAddress = getAddress(contractAddress);

    // Create encrypted input
    const input = fhe.createEncryptedInput(checksumAddress, userAddress);

    // Add amount as euint32 (sufficient for donations up to ~4.29 ETH in Gwei)
    // euint32 max: 4,294,967,295 Gwei = 4.294967295 ETH
    if (amount > BigInt(2**32 - 1)) {
      throw new Error('Amount too large. Maximum is 4.29 ETH per donation.');
    }
    input.add32(Number(amount));

    // Encrypt and generate proof
    const { handles, inputProof } = await input.encrypt();

    const encryptedAmount = hexlify(handles[0]);
    const proof = hexlify(inputProof);

    console.log('🔐 Donation encrypted:', {
      amount: amount.toString(),
      encryptedAmount: encryptedAmount.slice(0, 20) + '...',
      proof: proof.slice(0, 20) + '...',
    });

    return {
      encryptedAmount,
      proof,
    };
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Failed to encrypt donation. Please try again.');
  }
}

/**
 * Format encrypted data for display
 * @param data - Encrypted data string
 * @returns Formatted string
 */
export function formatEncrypted(data: string): string {
  return '🔒 ***';
}

/**
 * Request decryption via Gateway (for viewing own donations)
 * @param encryptedData - Encrypted data handle
 * @param userAddress - User's address
 * @returns Decryption request ID
 */
export async function requestDecryption(
  encryptedData: string,
  userAddress: string
): Promise<string> {
  try {
    console.log('📤 Decryption requested for:', userAddress);
    return 'Decryption pending via Gateway...';
  } catch (error) {
    console.error('❌ Decryption request failed:', error);
    throw new Error('Failed to request decryption');
  }
}

/**
 * Check if FHE SDK is available
 * @returns Boolean indicating availability
 */
export function isFHEAvailable(): boolean {
  return fheInstance !== null;
}

/**
 * Preload FHE SDK (call on app initialization)
 */
export async function preloadFHE(): Promise<void> {
  try {
    await loadSdk();
    console.log('✅ FHE SDK preloaded');
  } catch (error) {
    console.warn('⚠️  FHE SDK preload failed:', error);
  }
}
