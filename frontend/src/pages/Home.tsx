import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { RoundCard } from '@/components/RoundCard';
import { useRoundStore } from '@/stores/useRoundStore';
import { mockRounds } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { LockOutlined } from '@ant-design/icons';

export default function Home() {
  const { activeRounds, setActiveRounds } = useRoundStore();

  useEffect(() => {
    // Load rounds (mock data for now)
    setActiveRounds(mockRounds);
  }, [setActiveRounds]);

  const stats = [
    { label: 'Total Donated', value: '🔒 ***', description: 'Encrypted amount' },
    { label: 'Active Rounds', value: activeRounds.filter(r => r.status === 'active').length.toString(), description: 'Live funding rounds' },
    { label: 'Projects Funded', value: activeRounds.reduce((sum, r) => sum + r.projectCount, 0).toString(), description: 'Total projects' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="text-center py-16 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <LockOutlined />
          <span>Privacy-First Quadratic Funding</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
          Donate Anonymously with
          <br />
          <span className="text-gradient">FHE Encryption</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Support public goods while keeping your donations completely private. 
          Powered by Fully Homomorphic Encryption.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Button size="lg" className="px-8">
            Explore Projects
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="card-shadow rounded-lg border border-border bg-card p-6 text-center"
            >
              <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
              <div className="text-sm font-medium text-foreground mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Rounds */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Active Rounds</h2>
            <p className="text-muted-foreground">
              Support projects in ongoing funding rounds
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeRounds.map((round) => (
            <RoundCard key={round.id} round={round} />
          ))}
        </div>

        {activeRounds.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active rounds at the moment</p>
          </div>
        )}
      </section>
    </Layout>
  );
}
