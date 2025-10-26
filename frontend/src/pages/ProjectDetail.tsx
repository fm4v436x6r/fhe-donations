import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { EncryptedBadge } from '@/components/EncryptedBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockProjects, mockRounds } from '@/lib/mockData';
import { ArrowLeftOutlined, CheckCircleFilled, UserOutlined, WalletOutlined, LockOutlined } from '@ant-design/icons';
import { Avatar, Progress, Steps, Card } from 'antd';
import { toast } from 'sonner';
import { encryptDonation } from '@/lib/fhe';
import { useDonationStore } from '@/stores/useDonationStore';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { setIsEncrypting } = useDonationStore();

  // Find project (search all rounds)
  let project = null;
  let round = null;
  for (const r of mockRounds) {
    const projects = mockProjects[r.id] || [];
    const found = projects.find((p) => p.id === Number(projectId));
    if (found) {
      project = found;
      round = r;
      break;
    }
  }

  if (!project || !round) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </Layout>
    );
  }

  const minDonation = parseFloat(round.minDonation);
  const maxDonation = parseFloat(round.maxDonation);
  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum >= minDonation && amountNum <= maxDonation;

  const handleDonate = async () => {
    if (!isValidAmount) {
      toast.error('Invalid amount', {
        description: `Please enter an amount between ${minDonation} and ${maxDonation} ETH`,
      });
      return;
    }

    setIsSubmitting(true);
    setCurrentStep(0);

    try {
      // Step 1: Encrypting
      setCurrentStep(1);
      toast.loading('🔐 Encrypting your donation...', { id: 'encrypting' });
      setIsEncrypting(true);

      const amountWei = BigInt(Math.floor(amountNum * 1e18));
      await encryptDonation(amountWei, '0xContractAddress', '0xUserAddress');
      
      toast.dismiss('encrypting');
      setIsEncrypting(false);

      // Step 2: Submitting
      setCurrentStep(2);
      toast.loading('📤 Submitting to blockchain...', { id: 'submitting' });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.dismiss('submitting');

      // Step 3: Success
      setCurrentStep(3);
      toast.success('✅ Donation successful!', {
        description: `You donated ${amount} ETH to ${project.name}`,
      });

      setAmount('');
      setCurrentStep(0);
    } catch (error: any) {
      toast.error('Donation failed', {
        description: error.message,
      });
      setCurrentStep(0);
    } finally {
      setIsSubmitting(false);
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

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-shadow rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <UserOutlined className="text-2xl text-primary" />
                <div className="text-3xl font-bold text-foreground">{project.donorCount}</div>
              </div>
              <div className="text-sm text-muted-foreground">Donors</div>
            </div>
            <div className="card-shadow rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <WalletOutlined className="text-2xl text-primary" />
                <div className="text-3xl font-bold text-foreground">{project.totalDonations}</div>
              </div>
              <div className="text-sm text-muted-foreground">Total Raised</div>
            </div>
          </div>

          {/* Metadata */}
          <div className="card-shadow rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metadata URI</span>
                <span className="text-foreground font-mono">{project.metadataURI}</span>
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
            <h2 className="text-xl font-semibold text-foreground mb-6">Donate Now</h2>

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
                step="0.01"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Min: {minDonation} ETH • Max: {maxDonation} ETH
              </p>
            </div>

            {/* Privacy Notice */}
            <Card className="mb-6 bg-primary/5 border-primary/20">
              <div className="flex gap-3">
                <LockOutlined className="text-primary text-xl flex-shrink-0 mt-1" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">Complete Privacy</p>
                  <p className="text-muted-foreground">
                    Your donation amount and identity will be encrypted using FHE before submission. 
                    No one can see your contribution.
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
              {isSubmitting ? 'Processing...' : 'Donate Now'}
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
