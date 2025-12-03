import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { EncryptedBadge } from '@/components/EncryptedBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeftOutlined, CheckCircleFilled, UserOutlined, WalletOutlined, LockOutlined } from '@ant-design/icons';
import { Avatar, Steps, Card, Spin } from 'antd';
import { toast } from 'sonner';
import { encryptProjectId } from '@/lib/fhe';
import { useDonationStore } from '@/stores/useDonationStore';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config';
import type { Project, Round } from '@/types';

// Helper to get block explorer tx link
const getTxExplorerUrl = (hash: string) => `${NETWORK_CONFIG.BLOCK_EXPLORER}/tx/${hash}`;

// New ABI for the updated contract with encrypted project selection
const DONATION_ROUND_ABI = [
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
      { name: 'matchingPool', type: 'uint256' },
      { name: 'minDonation', type: 'uint256' },
      { name: 'maxDonation', type: 'uint256' },
      { name: 'isFinalized', type: 'bool' }
    ]
  },
  {
    name: 'donate',
    type: 'function',
    stateMutability: 'payable',  // Now payable - sends ETH directly
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'encryptedProjectId', type: 'bytes32' },  // Encrypted PROJECT ID
      { name: 'inputProof', type: 'bytes' }
    ],
    outputs: []
  }
] as const;

const PROJECT_REGISTRY_ABI = [
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

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { address: userAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { setIsEncrypting } = useDonationStore();
  const [project, setProject] = useState<Project | null>(null);
  const [round, setRound] = useState<Round | null>(null);

  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTxError, error: txError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Read project data
  const { data: projectData, isLoading: isLoadingProject } = useReadContract({
    address: CONTRACT_ADDRESSES.PROJECT_REGISTRY as `0x${string}`,
    abi: PROJECT_REGISTRY_ABI,
    functionName: 'projects',
    args: projectId ? [BigInt(projectId)] : undefined,
  });

  // Parse project data
  useEffect(() => {
    if (projectData && !isLoadingProject) {
      const [id, owner, metadataURI, isActive, isVerified] = projectData;

      let name = `Project #${Number(id)}`;
      let description = '';
      let roundIdFromMetadata = 1; // Default to round 1

      try {
        if (metadataURI.startsWith('data:application/json;base64,')) {
          const base64Data = metadataURI.replace('data:application/json;base64,', '');
          const jsonStr = atob(base64Data);
          const metadata = JSON.parse(jsonStr);
          name = metadata.name || name;
          description = metadata.description || '';
        }
      } catch (e) {
        console.error('Error parsing project metadata:', e);
      }

      setProject({
        id: Number(id),
        roundId: roundIdFromMetadata,
        name,
        description,
        metadataURI,
        creator: owner,
        verified: isVerified,
        donorCount: 0, // Will be updated from contract
        totalDonations: '🔒 Hidden',  // Encrypted
        createdAt: Date.now(),
      });
    }
  }, [projectData, isLoadingProject]);

  // Read round data (assuming round 1 for now)
  const { data: roundData, isLoading: isLoadingRound } = useReadContract({
    address: CONTRACT_ADDRESSES.DONATION_ROUND as `0x${string}`,
    abi: DONATION_ROUND_ABI,
    functionName: 'rounds',
    args: [BigInt(1)], // TODO: Get actual roundId from project
  });

  // Parse round data
  useEffect(() => {
    if (roundData && !isLoadingRound) {
      const [id, name, startTime, endTime, matchingPool, minDonation, maxDonation, isFinalized] = roundData;

      const now = Math.floor(Date.now() / 1000);
      let status: 'active' | 'upcoming' | 'finalized' = 'upcoming';
      if (isFinalized) {
        status = 'finalized';
      } else if (now >= Number(startTime) && now <= Number(endTime)) {
        status = 'active';
      } else if (now > Number(endTime)) {
        status = 'finalized';
      }

      setRound({
        id: Number(id),
        name,
        description: '',
        startDate: new Date(Number(startTime) * 1000).toISOString(),
        endDate: new Date(Number(endTime) * 1000).toISOString(),
        matchingPool: Number(matchingPool) / 1e18, // Wei to ETH
        totalDonations: 0,
        totalDonors: 0,
        projectCount: 0,
        status
      });
    }
  }, [roundData, isLoadingRound]);

  // Monitor transaction confirmation or failure
  useEffect(() => {
    if (isConfirmed && currentStep === 3 && txHash) {
      toast.dismiss('confirming');
      toast.success('Anonymous donation confirmed!', {
        description: (
          <div className="space-y-1">
            <p>Your vote has been recorded privately</p>
            <a
              href={getTxExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline text-sm flex items-center gap-1"
            >
              View on Explorer →
            </a>
          </div>
        ),
        duration: 8000,
      });
      setCurrentStep(0);
      setIsSubmitting(false);
      setTxHash(undefined);
    }
  }, [isConfirmed, currentStep, txHash]);

  // Monitor transaction errors
  useEffect(() => {
    if (isTxError && currentStep === 3) {
      toast.dismiss('confirming');
      const errorMessage = txError?.message?.includes('reverted')
        ? 'Transaction reverted - check contract state'
        : txError?.message?.slice(0, 100) || 'Transaction failed';

      toast.error('Transaction failed', {
        description: (
          <div className="space-y-1">
            <p className="text-sm">{errorMessage}</p>
            {txHash && (
              <a
                href={getTxExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline text-sm flex items-center gap-1"
              >
                View on Explorer →
              </a>
            )}
          </div>
        ),
        duration: 10000,
      });
      setCurrentStep(0);
      setIsSubmitting(false);
      setTxHash(undefined);
    }
  }, [isTxError, txError, currentStep, txHash]);

  // Handle loading states
  if (isLoadingProject || isLoadingRound) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="text-muted-foreground mt-4">Loading project...</p>
        </div>
      </Layout>
    );
  }

  // Handle error states
  if (!project || !round) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </Layout>
    );
  }

  // Round data is in wei now
  const minDonation = Number(roundData![5]) / 1e18; // Wei to ETH
  const maxDonation = Number(roundData![6]) / 1e18;
  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum >= minDonation && amountNum <= maxDonation;

  const handleDonate = async () => {
    if (!isValidAmount) {
      toast.error('Invalid amount', {
        description: `Please enter an amount between ${minDonation} and ${maxDonation} ETH`,
      });
      return;
    }

    if (!userAddress) {
      toast.error('Wallet not connected', {
        description: 'Please connect your wallet first',
      });
      return;
    }

    setIsSubmitting(true);
    setCurrentStep(0);

    try {
      // Step 1: Encrypting PROJECT ID (not amount!)
      setCurrentStep(1);
      toast.loading('🔐 Encrypting your project selection...', { id: 'encrypting' });
      setIsEncrypting(true);

      // ENCRYPT THE PROJECT ID - this is the privacy feature!
      // No one will know which project you're supporting
      const { encryptedProjectId, proof } = await encryptProjectId(
        Number(projectId!),
        CONTRACT_ADDRESSES.DONATION_ROUND as `0x${string}`,
        userAddress
      );

      toast.dismiss('encrypting');
      setIsEncrypting(false);

      // Step 2: Submitting transaction with ETH value
      setCurrentStep(2);
      toast.loading('📤 Submitting anonymous donation...', { id: 'submitting' });

      // Call donate() with encrypted project ID and send ETH
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.DONATION_ROUND as `0x${string}`,
        abi: DONATION_ROUND_ABI,
        functionName: 'donate',
        args: [
          BigInt(round.id),                      // roundId (public)
          encryptedProjectId as `0x${string}`,   // ENCRYPTED project ID
          proof as `0x${string}`                 // proof
        ],
        value: parseEther(amount),  // Send ETH directly (amount is public)
      });

      setTxHash(hash);
      toast.dismiss('submitting');

      // Step 3: Confirming - show tx link while waiting
      setCurrentStep(3);
      toast.loading(
        <div className="space-y-1">
          <p>Waiting for confirmation...</p>
          <a
            href={getTxExplorerUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline text-sm"
          >
            View transaction →
          </a>
        </div>,
        { id: 'confirming' }
      );

      setAmount('');
    } catch (error: any) {
      toast.dismiss('encrypting');
      toast.dismiss('submitting');
      toast.dismiss('confirming');

      // Parse error message for user-friendly display
      let errorMessage = 'Failed to submit transaction';
      if (error.message) {
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient ETH balance';
        } else if (error.message.includes('gas')) {
          errorMessage = 'Gas estimation failed - check contract state';
        } else {
          errorMessage = error.message.slice(0, 100);
        }
      }

      toast.error('Donation failed', {
        description: errorMessage,
        duration: 8000,
      });
      setCurrentStep(0);
      setIsSubmitting(false);
      setIsEncrypting(false);
    }
  };

  return (
    <Layout>
      {/* Back Button */}
      <Link to={`/rounds/${round.id}`} className="inline-block mb-6">
        <Button variant="ghost" size="sm">
          <ArrowLeftOutlined className="mr-2" />
          Back to Round
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Project Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner */}
          {project.logoUrl && (
            <div className="card-shadow rounded-lg border border-border overflow-hidden">
              <img
                src={project.logoUrl}
                alt={project.name}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Project Header */}
          <div className="card-shadow rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4 mb-4">
              <Avatar size={64} src={project.logoUrl} className="flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
                  {project.verified && (
                    <CheckCircleFilled className="text-primary text-xl" />
                  )}
                </div>
                <p className="text-muted-foreground">
                  Created by {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status={round.status} />
              <EncryptedBadge />
            </div>
          </div>

          {/* Description */}
          <div className="card-shadow rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">About</h2>
            <p className="text-muted-foreground leading-relaxed">{project.description}</p>
          </div>

          {/* Stats - Now showing encrypted data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-shadow rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <UserOutlined className="text-2xl text-primary" />
                <div className="text-3xl font-bold text-foreground">🔒</div>
              </div>
              <div className="text-sm text-muted-foreground">Donor Count (Hidden)</div>
            </div>
            <div className="card-shadow rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <WalletOutlined className="text-2xl text-primary" />
                <div className="text-3xl font-bold text-foreground">🔒</div>
              </div>
              <div className="text-sm text-muted-foreground">Total Raised (Hidden)</div>
            </div>
          </div>

          {/* Metadata */}
          <div className="card-shadow rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Metadata</span>
                <span className="text-foreground font-mono text-xs break-all text-right max-w-[300px]">
                  {project.metadataURI.startsWith('data:')
                    ? 'On-chain (Base64)'
                    : project.metadataURI}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Round</span>
                <Link to={`/rounds/${round.id}`} className="text-primary hover:underline">
                  {round.name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={round.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Donation Panel */}
        <div className="lg:col-span-1">
          <div className="card-shadow rounded-lg border border-border bg-card p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-foreground mb-6">Donate Anonymously</h2>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Amount (ETH)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting || round.status !== 'active'}
                className="text-lg"
                min={minDonation}
                max={maxDonation}
                step="0.001"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Min: {minDonation} ETH • Max: {maxDonation} ETH
              </p>
            </div>

            {/* Privacy Notice - Updated for new model */}
            <Card className="mb-6 bg-primary/5 border-primary/20">
              <div className="flex gap-3">
                <LockOutlined className="text-primary text-xl flex-shrink-0 mt-1" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">Anonymous Voting</p>
                  <p className="text-muted-foreground">
                    Your <strong>project selection is encrypted</strong> using FHE.
                    Everyone can see you donated, but <strong>no one knows which project</strong> you're supporting.
                  </p>
                </div>
              </div>
            </Card>

            {/* Progress Steps */}
            {isSubmitting && (
              <div className="mb-6">
                <Steps
                  current={currentStep}
                  size="small"
                  items={[
                    { title: 'Ready' },
                    { title: 'Encrypting' },
                    { title: 'Submitting' },
                    { title: 'Done' },
                  ]}
                />
              </div>
            )}

            {/* Donate Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleDonate}
              disabled={!isValidAmount || isSubmitting || round.status !== 'active'}
            >
              {isSubmitting ? 'Processing...' : 'Donate Anonymously'}
            </Button>

            {round.status !== 'active' && (
              <p className="text-xs text-center text-destructive mt-3">
                This round is not accepting donations
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
