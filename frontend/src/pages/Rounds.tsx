import { Layout } from '@/components/Layout';
import { RoundCard } from '@/components/RoundCard';
import { useRoundStore } from '@/stores/useRoundStore';
import { useEffect, useState } from 'react';
import { useAllRounds } from '@/hooks/useContracts';
import type { Round } from '@/types';
import { Spin } from 'antd';
import { Button } from '@/components/ui/button';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config';

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
  }
] as const;

export default function Rounds() {
  const navigate = useNavigate();
  const { activeRounds, setActiveRounds } = useRoundStore();
  const { roundIds, isLoading: isLoadingRounds } = useAllRounds();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch rounds data when roundIds change
  useEffect(() => {
    if (roundIds.length === 0) {
      setActiveRounds([]);
      return;
    }

    const fetchRounds = async () => {
      setIsLoading(true);
      const rounds: Round[] = [];

      for (const id of roundIds) {
        try {
          // Fetch round data directly using fetch/contract call
          // This avoids the hooks rule violation
          const response = await fetch(
            `https://ethereum-sepolia-rpc.publicnode.com`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [
                  {
                    to: CONTRACT_ADDRESSES.DONATION_ROUND,
                    data: `0x${'152a902d'}${id.toString(16).padStart(64, '0')}` // rounds(uint256)
                  },
                  'latest'
                ]
              })
            }
          );
          // For now, skip individual fetching - just show empty state
        } catch (error) {
          console.error('Error fetching round:', error);
        }
      }

      setIsLoading(false);
    };

    fetchRounds();
  }, [roundIds, setActiveRounds]);

  const activeRoundsList = activeRounds.filter(r => r.status === 'active');
  const upcomingRounds = activeRounds.filter(r => r.status === 'upcoming');
  const finalizedRounds = activeRounds.filter(r => r.status === 'finalized');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Funding Rounds</h1>
            <p className="text-muted-foreground">
              Browse all funding rounds and support public goods projects
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate('/create-round')}
            className="flex items-center gap-2"
          >
            <PlusOutlined />
            Create Round
          </Button>
        </div>

        {isLoadingRounds || isLoading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Active Rounds */}
            {activeRoundsList.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Active Rounds ({activeRoundsList.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeRoundsList.map((round) => (
                    <RoundCard key={round.id} round={round} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Rounds */}
            {upcomingRounds.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Upcoming Rounds ({upcomingRounds.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingRounds.map((round) => (
                    <RoundCard key={round.id} round={round} />
                  ))}
                </div>
              </section>
            )}

            {/* Finalized Rounds */}
            {finalizedRounds.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Finalized Rounds ({finalizedRounds.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finalizedRounds.map((round) => (
                    <RoundCard key={round.id} round={round} />
                  ))}
                </div>
              </section>
            )}

            {/* No rounds */}
            {activeRounds.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">
                  No funding rounds available yet
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Be the first to create a funding round
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate('/create-round')}
                  className="flex items-center gap-2"
                >
                  <PlusOutlined />
                  Create First Round
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
