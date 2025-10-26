import { Layout } from '@/components/Layout';
import { useNextRoundId, useNextProjectId } from '@/hooks/useContracts';
import { CONTRACT_ADDRESSES } from '@/config';

export default function Debug() {
  const { data: nextRoundId, isLoading: loadingRounds, error: roundError } = useNextRoundId();
  const { data: nextProjectId, isLoading: loadingProjects, error: projectError } = useNextProjectId();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Contract Debug Info</h1>

        <div className="space-y-6">
          {/* Contract Addresses */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Contract Addresses</h2>
            <div className="space-y-2 font-mono text-sm">
              <div>
                <span className="text-muted-foreground">QUADRATIC_FUNDING:</span>
                <br />
                <span className="text-foreground">{CONTRACT_ADDRESSES.QUADRATIC_FUNDING}</span>
              </div>
              <div>
                <span className="text-muted-foreground">PROJECT_REGISTRY:</span>
                <br />
                <span className="text-foreground">{CONTRACT_ADDRESSES.PROJECT_REGISTRY}</span>
              </div>
              <div>
                <span className="text-muted-foreground">DONATION_ROUND:</span>
                <br />
                <span className="text-foreground">{CONTRACT_ADDRESSES.DONATION_ROUND}</span>
              </div>
            </div>
          </div>

          {/* Rounds Info */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Rounds</h2>
            {loadingRounds ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : roundError ? (
              <div className="text-red-500">
                <p>Error loading rounds:</p>
                <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(roundError, null, 2)}</pre>
              </div>
            ) : (
              <div>
                <p className="text-foreground">
                  Next Round ID: <span className="font-mono font-bold">{nextRoundId?.toString() || 'N/A'}</span>
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Total Rounds Created: {nextRoundId ? Number(nextRoundId) - 1 : 0}
                </p>
              </div>
            )}
          </div>

          {/* Projects Info */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Projects</h2>
            {loadingProjects ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : projectError ? (
              <div className="text-red-500">
                <p>Error loading projects:</p>
                <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(projectError, null, 2)}</pre>
              </div>
            ) : (
              <div>
                <p className="text-foreground">
                  Next Project ID: <span className="font-mono font-bold">{nextProjectId?.toString() || 'N/A'}</span>
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Total Projects Created: {nextProjectId ? Number(nextProjectId) - 1 : 0}
                </p>
              </div>
            )}
          </div>

          {/* Network Info */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Network</h2>
            <div className="space-y-2">
              <p className="text-foreground">
                <span className="text-muted-foreground">Chain ID:</span> 11155111 (Sepolia)
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">RPC:</span> https://ethereum-sepolia-rpc.publicnode.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
