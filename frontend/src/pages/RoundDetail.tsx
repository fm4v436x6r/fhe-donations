import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProjectCard } from '@/components/ProjectCard';
import { StatusBadge } from '@/components/StatusBadge';
import { EncryptedBadge } from '@/components/EncryptedBadge';
import { useRoundStore } from '@/stores/useRoundStore';
import { mockRounds, mockProjects } from '@/lib/mockData';
import { ArrowLeftOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Button } from '@/components/ui/button';

export default function RoundDetail() {
  const { roundId } = useParams<{ roundId: string }>();
  const { selectedRound, selectRound, roundProjects, setRoundProjects } = useRoundStore();

  useEffect(() => {
    // Load round and projects
    const round = mockRounds.find((r) => r.id === Number(roundId));
    if (round) {
      selectRound(round);
      const projects = mockProjects[round.id] || [];
      setRoundProjects(round.id, projects);
    }
  }, [roundId, selectRound, setRoundProjects]);

  if (!selectedRound) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Round not found</p>
        </div>
      </Layout>
    );
  }

  const projects = roundProjects[selectedRound.id] || [];
  const daysLeft = Math.ceil((selectedRound.endTime - Date.now()) / (1000 * 60 * 60 * 24));

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
              <StatusBadge status={selectedRound.status} />
              <EncryptedBadge />
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-3">
              {selectedRound.name}
            </h1>

            {selectedRound.status === 'active' && (
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
                {selectedRound.matchingPool}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Projects</div>
              <div className="text-2xl font-bold text-foreground">
                {selectedRound.projectCount}
              </div>
            </div>
          </div>
        </div>

        {/* Donation Limits */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-8 text-sm">
            <div>
              <span className="text-muted-foreground">Min Donation: </span>
              <span className="font-semibold text-foreground">{selectedRound.minDonation} ETH</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Donation: </span>
              <span className="font-semibold text-foreground">{selectedRound.maxDonation} ETH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Projects</h2>
        <p className="text-muted-foreground">
          Select a project to donate anonymously
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 card-shadow rounded-lg border border-border bg-card">
          <p className="text-muted-foreground">No projects in this round yet</p>
        </div>
      )}
    </Layout>
  );
}
