/**
 * FHE (Fully Homomorphic Encryption) utilities using Zama SDK
 * Client-side encryption for private donations
 * SDK is loaded from CDN in index.html
 */

export interface EncryptedData {
  encryptedAmount: string;
  proof: string;
}

// Global FHE instance
let relayerSDK: any = null;

/**
 * Initialize FHE Relayer SDK (from CDN)
 * @returns FHE instance
 */
export async function initFHE() {
  if (relayerSDK) return relayerSDK;

  // Check if SDK is loaded from CDN
  if (typeof window !== 'undefined' && (window as any).relayerSDK) {
    relayerSDK = (window as any).relayerSDK;
    console.log('✅ FHE SDK loaded from CDN');
    return relayerSDK;
  }

  // SDK should be loaded from CDN
  console.error('❌ FHE SDK not loaded');
  throw new Error(
    'FHE SDK not available. Please ensure the CDN script is loaded in index.html'
  );
}

/**
 * Encrypt donation amount using FHE
 * @param amount - Amount in wei (bigint)
 * @param contractAddress - Target contract address
 * @param userAddress - User's wallet address
 * @returns Encrypted amount and proof
 */
export async function encryptDonation(
  amount: bigint,
  contractAddress: string,
  userAddress: string
): Promise<EncryptedData> {
  try {
    const fhe = await initFHE();

    // Create encrypted input
    const input = fhe.createEncryptedInput(contractAddress, userAddress);

    // Add amount as euint32 (sufficient for donations, max ~4.3 ETH)
    // Convert bigint to number for add32 (safe since max is 2^32)
    if (amount > BigInt(2**32 - 1)) {
      throw new Error('Amount too large. Maximum is 4.3 ETH per donation.');
    }
    input.add32(Number(amount));

    // Encrypt and generate proof
    const { handles, inputProof } = await input.encrypt();

    // Convert to hex strings
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
 * Convert Uint8Array to hex string
 * @param arr - Uint8Array
 * @returns Hex string with 0x prefix
 */
function hexlify(arr: Uint8Array): string {
  return '0x' + Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
  const fhe = await initFHE();

  try {
    // This would integrate with Gateway for actual decryption
    // For now, return pending status
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
  return typeof window !== 'undefined' && !!(window as any).relayerSDK;
}

/**
 * Preload FHE SDK (call on app initialization)
 */
export async function preloadFHE(): Promise<void> {
  try {
    await initFHE();
    console.log('✅ FHE SDK preloaded');
  } catch (error) {
    console.warn('⚠️  FHE SDK preload failed:', error);
  }
}
