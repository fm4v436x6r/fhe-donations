import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from 'antd';
import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config';
import { toast } from 'sonner';

const QUADRATIC_FUNDING_ABI = [
  {
    name: 'createRound',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'matchingPoolAmount', type: 'uint256' },
      { name: 'minDonation', type: 'uint256' },
      { name: 'maxDonation', type: 'uint256' }
    ],
    outputs: [{ name: 'roundId', type: 'uint256' }]
  }
] as const;

export default function CreateRound() {
  const { address: userAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    matchingPoolETH: '',
    minDonationETH: '0.001',
    maxDonationETH: '10',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate form
      const { name, startDate, endDate, matchingPoolETH, minDonationETH, maxDonationETH } = formData;

      if (!name || !startDate || !endDate || !matchingPoolETH) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      const startTime = Math.floor(new Date(startDate).getTime() / 1000);
      const endTime = Math.floor(new Date(endDate).getTime() / 1000);
      const now = Math.floor(Date.now() / 1000);

      if (startTime <= now) {
        toast.error('Start time must be in the future');
        setIsSubmitting(false);
        return;
      }

      if (endTime <= startTime) {
        toast.error('End time must be after start time');
        setIsSubmitting(false);
        return;
      }

      // Convert ETH amounts to Gwei (no encryption needed - public matching pool)
      const matchingPoolGwei = BigInt(Math.floor(parseFloat(matchingPoolETH) * 1e9));
      const minDonationGwei = BigInt(Math.floor(parseFloat(minDonationETH) * 1e9));
      const maxDonationGwei = BigInt(Math.floor(parseFloat(maxDonationETH) * 1e9));

      if (matchingPoolGwei > BigInt(2**32 - 1)) {
        toast.error('Matching pool too large. Maximum is 4.29 ETH');
        setIsSubmitting(false);
        return;
      }

      // Create round on-chain (matching pool is public, no encryption)
      toast.loading('Creating round on blockchain...', { id: 'creating' });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.QUADRATIC_FUNDING as `0x${string}`,
        abi: QUADRATIC_FUNDING_ABI,
        functionName: 'createRound',
        args: [
          name,
          BigInt(startTime),
          BigInt(endTime),
          matchingPoolGwei,
          minDonationGwei,
          maxDonationGwei
        ],
      });

      setTxHash(hash);
      toast.dismiss('creating');
      toast.loading('Waiting for confirmation...', { id: 'confirming' });

    } catch (error: any) {
      console.error('Error creating round:', error);
      toast.dismiss('creating');
      toast.dismiss('confirming');
      toast.error(error.message || 'Failed to create round');
      setIsSubmitting(false);
    }
  };

  // Monitor transaction confirmation
  if (isConfirmed && txHash) {
    toast.dismiss('confirming');
    toast.success('Round created successfully!', {
      description: 'Your funding round is now live',
      duration: 5000,
    });
    setIsSubmitting(false);
    setTxHash(undefined);

    // Reset form
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      matchingPoolETH: '',
      minDonationETH: '0.001',
      maxDonationETH: '10',
    });
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create Funding Round</h1>
          <p className="text-muted-foreground">
            Launch a new quadratic funding round with public matching pool
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Round Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Round Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Q1 2025 Public Goods Round"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Matching Pool */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Matching Pool Amount (ETH) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                max="4.29"
                value={formData.matchingPoolETH}
                onChange={(e) => setFormData({ ...formData, matchingPoolETH: e.target.value })}
                placeholder="e.g., 1.0"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: 4.29 ETH (public, transparent matching pool)
              </p>
            </div>

            {/* Min Donation */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Minimum Donation (ETH) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.minDonationETH}
                onChange={(e) => setFormData({ ...formData, minDonationETH: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Max Donation */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Maximum Donation (ETH) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                max="4.29"
                value={formData.maxDonationETH}
                onChange={(e) => setFormData({ ...formData, maxDonationETH: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: 4.29 ETH per donation
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🔒 Privacy Features</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Matching pool amount is public and transparent</li>
                <li>• Donor donations will be encrypted using FHE</li>
                <li>• Individual donation amounts remain private</li>
                <li>• Quadratic funding calculations on encrypted data</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting || isConfirming || !userAddress}
            >
              {isSubmitting || isConfirming ? 'Creating Round...' : 'Create Funding Round'}
            </Button>

            {!userAddress && (
              <p className="text-sm text-muted-foreground text-center">
                Please connect your wallet to create a round
              </p>
            )}
          </form>
        </Card>
      </div>
    </Layout>
  );
}
