export interface Round {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  matchingPool: string; // encrypted
  minDonation: string;
  maxDonation: string;
  status: 'active' | 'closed' | 'finalized' | 'cancelled';
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
  projectId: number;
  donor: string;
  amount: string; // encrypted
  timestamp: number;
  transactionHash: string;
}

export interface EncryptedData {
  encryptedAmount: string;
  proof: string;
}

export type RoundStatus = 'active' | 'closed' | 'finalized' | 'cancelled';
