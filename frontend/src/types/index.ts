export interface Round {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  matchingPool: string;
  minDonation: string;
  maxDonation: string;
  status: 'active' | 'upcoming' | 'finalized' | 'closed' | 'cancelled';
  projectCount: number;
}

export interface Project {
  id: number;
  roundId: number;
  name: string;
  description: string;
  metadataURI: string;
  logoUrl?: string;
  creator: string;
  verified: boolean;
  donorCount: number;
  totalDonations: string; // encrypted
  createdAt: number;
}

export interface Donation {
  id: string;
  roundId: number;
  // projectId is ENCRYPTED - not visible to anyone
  donor: string;
  amount: string; // Public (ETH transfers are visible)
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
}

export interface EncryptedData {
  encryptedAmount: string;
  proof: string;
}

export type RoundStatus = 'active' | 'upcoming' | 'closed' | 'finalized' | 'cancelled';
