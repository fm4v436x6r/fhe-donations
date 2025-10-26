import { Layout } from '@/components/Layout';
import { Tabs, Card, Button as AntButton } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

export default function Admin() {
  const tabs = [
    {
      key: '1',
      label: 'Create Round',
      children: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Create a new funding round with matching pool and donation limits.
          </p>
          <Card>
            <p className="text-sm text-muted-foreground">Form coming soon...</p>
          </Card>
        </div>
      ),
    },
    {
      key: '2',
      label: 'Verify Projects',
      children: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Review and approve submitted projects.
          </p>
          <Card>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold text-foreground">Project {i}</h4>
                    <p className="text-sm text-muted-foreground">Pending verification</p>
                  </div>
                  <div className="flex gap-2">
                    <AntButton type="primary" icon={<CheckOutlined />} size="small">
                      Approve
                    </AntButton>
                    <AntButton danger icon={<CloseOutlined />} size="small">
                      Reject
                    </AntButton>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: '3',
      label: 'Manage Rounds',
      children: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Close rounds, calculate matching, and finalize results.
          </p>
          <Card>
            <p className="text-sm text-muted-foreground">Management tools coming soon...</p>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage funding rounds, verify projects, and oversee platform operations.
          </p>
        </div>

        {/* Tabs */}
        <div className="card-shadow rounded-lg border border-border bg-card overflow-hidden">
          <Tabs
            defaultActiveKey="1"
            items={tabs}
            className="p-6"
          />
        </div>
      </div>
    </Layout>
  );
}
