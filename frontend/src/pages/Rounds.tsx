import { Layout } from '@/components/Layout';
import { RoundCard } from '@/components/RoundCard';
import { useEffect } from 'react';
import { useAllRounds } from '@/hooks/useContracts';
import type { Round } from '@/types';
import { Spin, Card } from 'antd';
import { Button } from '@/components/ui/button';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useReadContracts } from 'wagmi';
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
  const { roundIds, isLoading: isLoadingRounds, totalRounds } = useAllRounds();

  // Batch read all rounds at once using multicall
  const { data: roundsData, isLoading: isLoadingData } = useReadContracts({
    contracts: roundIds.map(id => ({
      address: CONTRACT_ADDRESSES.DONATION_ROUND as `0x${string}`,
      abi: DONATION_ROUND_ABI,
      functionName: 'rounds',
      args: [id],
    })),
  });

  // Parse rounds data
  const rounds: Round[] = [];
  if (roundsData) {
    roundsData.forEach((result, index) => {
      if (result.status === 'success' && result.result) {
        const [id, name, startTime, endTime, matchingPool, minDonation, maxDonation, isFinalized] = result.result;

        // Determine status
        const now = Math.floor(Date.now() / 1000);
        let status: 'active' | 'upcoming' | 'finalized' = 'upcoming';
        if (isFinalized) {
          status = 'finalized';
        } else if (now >= Number(startTime) && now <= Number(endTime)) {
          status = 'active';
        } else if (now > Number(endTime)) {
          status = 'finalized';
        }

        rounds.push({
          id: Number(id),
          name,
          description: '',
          startDate: new Date(Number(startTime) * 1000).toISOString(),
          endDate: new Date(Number(endTime) * 1000).toISOString(),
          matchingPool: Number(matchingPool) / 1e9, // Convert from Gwei to ETH
          totalDonations: 0,
          totalDonors: 0,
          projectCount: 0,
          status
        });
      }
    });
  }

  const activeRoundsList = rounds.filter(r => r.status === 'active');
  const upcomingRounds = rounds.filter(r => r.status === 'upcoming');
  const finalizedRounds = rounds.filter(r => r.status === 'finalized');

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

        {isLoadingRounds || isLoadingData ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
            <p className="text-muted-foreground ml-4">
              {isLoadingRounds ? 'Checking for rounds...' : 'Loading round details...'}
            </p>
          </div>
        ) : roundIds.length === 0 ? (
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
        ) : rounds.length === 0 ? (
          <div className="text-center py-12">
            <Spin size="large" />
            <p className="text-muted-foreground mt-4">Loading round data...</p>
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

          </>
        )}
      </div>
    </Layout>
  );
}
