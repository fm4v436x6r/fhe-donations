import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProjectCard } from '@/components/ProjectCard';
import { StatusBadge } from '@/components/StatusBadge';
import { EncryptedBadge } from '@/components/EncryptedBadge';
import { ArrowLeftOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from '@/components/ui/button';
import { Spin } from 'antd';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config';
import type { Round, Project } from '@/types';

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

export default function RoundDetail() {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const [round, setRound] = useState<Round | null>(null);

  // Read round data from contract
  const { data: roundData, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.DONATION_ROUND as `0x${string}`,
    abi: DONATION_ROUND_ABI,
    functionName: 'rounds',
    args: roundId ? [BigInt(roundId)] : undefined,
  });

  useEffect(() => {
    if (roundData && !isLoading) {
      const [id, name, startTime, endTime, matchingPool, minDonation, maxDonation, isFinalized] = roundData;

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

      setRound({
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
  }, [roundData, isLoading]);

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="text-muted-foreground mt-4">Loading round data...</p>
        </div>
      </Layout>
    );
  }

  if (error || !round) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Round not found</p>
          <Button onClick={() => navigate('/rounds')} className="mt-4">
            Back to Rounds
          </Button>
        </div>
      </Layout>
    );
  }

  const endDate = new Date(round.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // For now, projects list is empty until we implement project creation
  const projects: Project[] = [];

  return (
    <Layout>
      {/* Back Button */}
      <Link to="/" className="inline-block mb-6">
        <Button variant="ghost" size="sm">
          <ArrowLeftOutlined className="mr-2" />
          Back to Home
        </Button>
      </Link>

      {/* Round Header */}
      <div className="card-shadow rounded-lg border border-border bg-card p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={round.status} />
              <EncryptedBadge />
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-3">
              {round.name}
            </h1>

            {round.status === 'active' && (
              <div className="flex items-center gap-2 text-lg text-muted-foreground mb-4">
                <ClockCircleOutlined className="text-primary" />
                <span>
                  {daysLeft > 0 ? `${daysLeft} days remaining` : 'Ends today'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 md:text-right">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Matching Pool</div>
              <div className="text-2xl font-bold text-foreground">
                {round.matchingPool} ETH
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Projects</div>
              <div className="text-2xl font-bold text-foreground">
                {projects.length}
              </div>
            </div>
          </div>
        </div>

        {/* Donation Limits */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-8 text-sm">
            <div>
              <span className="text-muted-foreground">Min Donation: </span>
              <span className="font-semibold text-foreground">
                {(Number(roundData![5]) / 1e9).toFixed(4)} ETH
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Donation: </span>
              <span className="font-semibold text-foreground">
                {(Number(roundData![6]) / 1e9).toFixed(4)} ETH
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Projects</h2>
          <p className="text-muted-foreground">
            Select a project to donate anonymously
          </p>
        </div>
        {round.status === 'active' && (
          <Button
            onClick={() => navigate(`/create-project?roundId=${roundId}`)}
            className="flex items-center gap-2"
          >
            <PlusOutlined />
            Create Project
          </Button>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 card-shadow rounded-lg border border-border bg-card">
          <p className="text-muted-foreground text-lg mb-4">No projects in this round yet</p>
          <p className="text-sm text-muted-foreground mb-6">
            Be the first to add a project to this funding round
          </p>
          <Button
            onClick={() => navigate(`/create-project?roundId=${roundId}`)}
            className="flex items-center gap-2"
          >
            <PlusOutlined />
            Create First Project
          </Button>
        </div>
      )}
    </Layout>
  );
}
