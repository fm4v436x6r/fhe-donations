import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input, Form, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config';

const { TextArea } = Input;

const PROJECT_REGISTRY_ABI = [
  {
    name: 'registerProject',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'metadataURI', type: 'string' }],
    outputs: [{ name: 'projectId', type: 'uint256' }]
  }
] as const;

export default function CreateProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roundId = searchParams.get('roundId');

  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleSubmit = async (values: { name: string; description: string; website?: string; github?: string }) => {
    try {
      setIsSubmitting(true);

      // Create simple JSON metadata (not uploading to IPFS for demo)
      const metadata = {
        name: values.name,
        description: values.description,
        website: values.website || '',
        github: values.github || '',
        createdAt: new Date().toISOString(),
      };

      // For demo, use data URI instead of IPFS
      const metadataJSON = JSON.stringify(metadata);
      const metadataURI = `data:application/json;base64,${btoa(metadataJSON)}`;

      message.loading({ content: 'Creating project...', key: 'create-project' });

      // Call registerProject
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.PROJECT_REGISTRY as `0x${string}`,
        abi: PROJECT_REGISTRY_ABI,
        functionName: 'registerProject',
        args: [metadataURI],
      });

      setTxHash(hash);

      message.loading({ content: 'Waiting for confirmation...', key: 'create-project' });

      // Wait for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 3000));

      message.success({ content: 'Project created successfully!', key: 'create-project' });

      // Navigate back to round detail if roundId exists
      if (roundId) {
        navigate(`/rounds/${roundId}`);
      } else {
        navigate('/rounds');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      message.error({
        content: error?.message || 'Failed to create project',
        key: 'create-project'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(roundId ? `/rounds/${roundId}` : '/rounds')}
          className="mb-6"
        >
          <ArrowLeftOutlined className="mr-2" />
          Back to {roundId ? 'Round' : 'Rounds'}
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create New Project</h1>
          <p className="text-muted-foreground">
            Register your project to receive funding from donors
          </p>
        </div>

        {/* Form */}
        <div className="card-shadow rounded-lg border border-border bg-card p-8">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            disabled={isSubmitting || isConfirming}
          >
            <Form.Item
              label="Project Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter project name' },
                { min: 3, message: 'Name must be at least 3 characters' },
                { max: 100, message: 'Name must be at most 100 characters' }
              ]}
            >
              <Input
                size="large"
                placeholder="e.g., OpenZeppelin SDK"
                disabled={isSubmitting || isConfirming}
              />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
              rules={[
                { required: true, message: 'Please enter project description' },
                { min: 20, message: 'Description must be at least 20 characters' },
                { max: 500, message: 'Description must be at most 500 characters' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Describe your project, its goals, and how funding will be used..."
                disabled={isSubmitting || isConfirming}
              />
            </Form.Item>

            <Form.Item
              label="Website (Optional)"
              name="website"
              rules={[
                { type: 'url', message: 'Please enter a valid URL' }
              ]}
            >
              <Input
                size="large"
                placeholder="https://example.com"
                disabled={isSubmitting || isConfirming}
              />
            </Form.Item>

            <Form.Item
              label="GitHub Repository (Optional)"
              name="github"
              rules={[
                { type: 'url', message: 'Please enter a valid URL' }
              ]}
            >
              <Input
                size="large"
                placeholder="https://github.com/username/repo"
                disabled={isSubmitting || isConfirming}
              />
            </Form.Item>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> For this demo, project metadata is stored as a data URI.
                In production, you would upload to IPFS or another decentralized storage solution.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(roundId ? `/rounds/${roundId}` : '/rounds')}
                disabled={isSubmitting || isConfirming}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || isConfirming}
                className="flex-1"
              >
                {isSubmitting || isConfirming ? (
                  <>
                    <Spin size="small" className="mr-2" />
                    {isConfirming ? 'Confirming...' : 'Creating...'}
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
