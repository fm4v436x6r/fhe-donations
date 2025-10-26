import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Table, Tag, Button as AntButton } from 'antd';
import { useDonationStore } from '@/stores/useDonationStore';
import { mockDonations, mockRounds, mockProjects } from '@/lib/mockData';
import { LockOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Donation } from '@/types';

export default function MyDonations() {
  const { userDonations, setUserDonations } = useDonationStore();

  useEffect(() => {
    // Load user donations (mock data)
    setUserDonations(mockDonations);
  }, [setUserDonations]);

  const columns: ColumnsType<Donation> = [
    {
      title: 'Round',
      dataIndex: 'roundId',
      key: 'roundId',
      render: (roundId: number) => {
        const round = mockRounds.find((r) => r.id === roundId);
        return round ? round.name : `Round ${roundId}`;
      },
    },
    {
      title: 'Project',
      dataIndex: 'projectId',
      key: 'projectId',
      render: (projectId: number, record) => {
        const projects = mockProjects[record.roundId] || [];
        const project = projects.find((p) => p.id === projectId);
        return project ? project.name : `Project ${projectId}`;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string) => (
        <span className="flex items-center gap-2">
          <LockOutlined className="text-primary" />
          <span className="font-mono">{amount}</span>
        </span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
      },
    },
    {
      title: 'Transaction',
      dataIndex: 'transactionHash',
      key: 'transactionHash',
      render: (hash: string) => (
        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-mono text-xs"
        >
          {hash.slice(0, 10)}...
        </a>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <AntButton size="small" type="link">
          View Receipt
        </AntButton>
      ),
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Donations</h1>
          <p className="text-muted-foreground">
            View your donation history. All amounts are encrypted for privacy.
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="card-shadow rounded-lg border border-primary/20 bg-primary/5 p-6 mb-6">
          <div className="flex gap-3">
            <LockOutlined className="text-primary text-2xl flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Privacy Protected</h3>
              <p className="text-sm text-muted-foreground">
                Your donation amounts are encrypted using FHE. Only you can request decryption 
                through the Gateway service. This ensures complete privacy while maintaining 
                transparency for the quadratic funding calculations.
              </p>
            </div>
          </div>
        </div>

        {/* Donations Table */}
        <div className="card-shadow rounded-lg border border-border bg-card overflow-hidden">
          <Table
            columns={columns}
            dataSource={userDonations}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} donations`,
            }}
            locale={{
              emptyText: (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No donations yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start supporting projects to see your donation history here
                  </p>
                </div>
              ),
            }}
          />
        </div>
      </div>
    </Layout>
  );
}
