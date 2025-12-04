import { useEffect, useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Table, Spin, Empty } from 'antd';
import { useAccount, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '@/config';
import { LockOutlined, LinkOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// Helper to get block explorer link
const getAddressExplorerUrl = (address: string) => `${NETWORK_CONFIG.BLOCK_EXPLORER}/address/${address}`;

// ABI for reading round info and donor totals
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
      { name: 'isFinalized', type: 'bool' },
      { name: 'totalProjects', type: 'uint256' },
      { name: 'totalDonations', type: 'uint256' }
    ]
  },
  {
    name: 'nextRoundId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getDonorTotal',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'donor', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

interface RoundDonation {
  id: string;
  roundId: number;
  roundName: string;
  totalAmount: string;
  startTime: number;
  endTime: number;
  isFinalized: boolean;
  status: 'active' | 'upcoming' | 'ended' | 'finalized';
}

export default function MyDonations() {
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [roundDonations, setRoundDonations] = useState<RoundDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's donations from contract (not events)
  useEffect(() => {
    if (!userAddress || !publicClient || !isConnected) {
      setRoundDonations([]);
      setIsLoading(false);
      return;
    }

    const fetchDonations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get total number of rounds
        const nextRoundId = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.DONATION_ROUND as `0x${string}`,
          abi: DONATION_ROUND_ABI,
          functionName: 'nextRoundId'
        }) as bigint;

        const donations: RoundDonation[] = [];
        const now = Math.floor(Date.now() / 1000);

        // Check each round for user's donations
        for (let roundId = 1; roundId < Number(nextRoundId); roundId++) {
          // Get user's total donation for this round
          const donorTotal = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.DONATION_ROUND as `0x${string}`,
            abi: DONATION_ROUND_ABI,
            functionName: 'getDonorTotal',
            args: [BigInt(roundId), userAddress]
          }) as bigint;

          // Only include rounds where user has donated
          if (donorTotal > 0n) {
            // Get round info
            const roundData = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.DONATION_ROUND as `0x${string}`,
              abi: DONATION_ROUND_ABI,
              functionName: 'rounds',
              args: [BigInt(roundId)]
            }) as [bigint, string, bigint, bigint, bigint, bigint, bigint, boolean, bigint, bigint];

            const startTime = Number(roundData[2]);
            const endTime = Number(roundData[3]);
            const isFinalized = roundData[7];

            // Determine status
            let status: 'active' | 'upcoming' | 'ended' | 'finalized';
            if (isFinalized) {
              status = 'finalized';
            } else if (now < startTime) {
              status = 'upcoming';
            } else if (now > endTime) {
              status = 'ended';
            } else {
              status = 'active';
            }

            donations.push({
              id: `round-${roundId}`,
              roundId,
              roundName: roundData[1] || `Round ${roundId}`,
              totalAmount: formatEther(donorTotal),
              startTime,
              endTime,
              isFinalized,
              status
            });
          }
        }

        // Sort by roundId descending (newest first)
        donations.sort((a, b) => b.roundId - a.roundId);

        setRoundDonations(donations);
      } catch (err: any) {
        console.error('Error fetching donations:', err);
        setError(err.message || 'Failed to fetch donation history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, [userAddress, publicClient, isConnected]);

  // Calculate totals
  const totalDonated = useMemo(() => {
    return roundDonations.reduce((sum, d) => sum + parseFloat(d.totalAmount), 0);
  }, [roundDonations]);

  const getStatusTag = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      ended: 'bg-gray-100 text-gray-800',
      finalized: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns: ColumnsType<RoundDonation> = [
    {
      title: 'Round',
      dataIndex: 'roundName',
      key: 'roundName',
      render: (name: string, record) => (
        <a
          href={`/rounds/${record.roundId}`}
          className="text-primary hover:underline font-medium"
        >
          {name}
        </a>
      ),
    },
    {
      title: 'Project Selection',
      key: 'project',
      render: () => (
        <span className="flex items-center gap-2 text-muted-foreground">
          <EyeInvisibleOutlined className="text-primary" />
          <span className="italic">Encrypted</span>
        </span>
      ),
    },
    {
      title: 'Total Donated',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: string) => (
        <span className="font-mono font-semibold text-primary">
          {parseFloat(amount).toFixed(4)} ETH
        </span>
      ),
    },
    {
      title: 'Round Period',
      key: 'period',
      render: (_, record) => {
        const start = new Date(record.startTime * 1000);
        const end = new Date(record.endTime * 1000);
        return (
          <span className="text-muted-foreground text-sm">
            {start.toLocaleDateString()} - {end.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Donations</h1>
          <p className="text-muted-foreground">
            View your participation in funding rounds
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="card-shadow rounded-lg border border-primary/20 bg-primary/5 p-6 mb-6">
          <div className="flex gap-3">
            <LockOutlined className="text-primary text-2xl flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Privacy Protected Voting</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Your project selections are encrypted with FHE</strong> - no one can see which
                projects you supported! Donation amounts are public (ETH transfers are visible on-chain),
                but your vote remains completely private. This prevents vote buying, social pressure,
                and strategic voting based on others' choices.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {isConnected && roundDonations.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card-shadow rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Donated</p>
              <p className="text-2xl font-bold text-primary">{totalDonated.toFixed(4)} ETH</p>
            </div>
            <div className="card-shadow rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Rounds Participated</p>
              <p className="text-2xl font-bold text-foreground">{roundDonations.length}</p>
            </div>
          </div>
        )}

        {/* Donations Table */}
        <div className="card-shadow rounded-lg border border-border bg-card overflow-hidden">
          {!isConnected ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Connect your wallet to view donation history</p>
            </div>
          ) : isLoading ? (
            <div className="py-12 text-center">
              <Spin size="large" />
              <p className="text-muted-foreground mt-4">Loading donation history...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <p className="text-sm text-muted-foreground">
                Please try refreshing the page
              </p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={roundDonations}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} rounds`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="py-4">
                        <p className="text-muted-foreground mb-2">No donations yet</p>
                        <p className="text-sm text-muted-foreground">
                          Start supporting projects to see your donation history here
                        </p>
                      </div>
                    }
                  />
                ),
              }}
            />
          )}
        </div>

        {/* Contract info */}
        {isConnected && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Data read directly from contract •{' '}
            <a
              href={getAddressExplorerUrl(CONTRACT_ADDRESSES.DONATION_ROUND)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              View Contract <LinkOutlined />
            </a>
          </p>
        )}
      </div>
    </Layout>
  );
}
