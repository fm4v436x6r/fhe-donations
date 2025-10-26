import { useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { RoundCard } from '@/components/RoundCard';
import { Button } from '@/components/ui/button';
import { LockOutlined, PlusOutlined } from '@ant-design/icons';
import { useAllRounds, useAllProjects } from '@/hooks/useContracts';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const { totalRounds } = useAllRounds();
  const { totalProjects } = useAllProjects();

  const stats = useMemo(() => [
    { label: 'Total Donated', value: '🔒 ***', description: 'Encrypted amount' },
    { label: 'Active Rounds', value: totalRounds.toString(), description: 'Live funding rounds' },
    { label: 'Projects Funded', value: totalProjects.toString(), description: 'Total projects' },
  ], [totalRounds, totalProjects]);

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
          <Button size="lg" className="px-8" onClick={() => navigate('/rounds')}>
            Explore Rounds
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/create-round')}>
            Create Round
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

      {/* Call to Action */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Get Started</h2>
            <p className="text-muted-foreground">
              Browse funding rounds or create your own
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-shadow rounded-lg border border-border bg-card p-8">
            <h3 className="text-2xl font-bold text-foreground mb-3">Browse Rounds</h3>
            <p className="text-muted-foreground mb-6">
              Explore active funding rounds and support public goods projects with encrypted donations
            </p>
            <Button size="lg" onClick={() => navigate('/rounds')} className="w-full">
              View All Rounds
            </Button>
          </div>

          <div className="card-shadow rounded-lg border border-border bg-card p-8">
            <h3 className="text-2xl font-bold text-foreground mb-3">Create a Round</h3>
            <p className="text-muted-foreground mb-6">
              Launch your own quadratic funding round to support projects you care about
            </p>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/create-round')}
              className="w-full flex items-center justify-center gap-2"
            >
              <PlusOutlined />
              Create New Round
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
