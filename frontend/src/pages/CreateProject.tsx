import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Form, Card, Input as AntInput } from 'antd';
import { toast } from 'sonner';

const { TextArea } = AntInput;

export default function CreateProject() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      // Simulate submission
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.success('Project submitted!', {
        description: 'Your project has been submitted for verification. You will be notified once it is approved.',
      });
      
      form.resetFields();
    } catch (error: any) {
      toast.error('Submission failed', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create New Project</h1>
          <p className="text-muted-foreground">
            Submit your project for review. Once approved, it will be available for donations in funding rounds.
          </p>
        </div>

        {/* Form */}
        <div className="card-shadow rounded-lg border border-border bg-card p-8">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              label="Project Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter project name' },
                {
                  validator: (_, value) => {
                    if (!value || value.length <= 100) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Name must be less than 100 characters'));
                  },
                },
              ]}
            >
              <AntInput
                placeholder="Enter your project name"
                size="large"
                disabled={isSubmitting}
              />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
              rules={[
                { required: true, message: 'Please enter project description' },
                {
                  validator: (_, value) => {
                    if (!value || value.length <= 500) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Description must be less than 500 characters'));
                  },
                },
              ]}
            >
              <TextArea
                placeholder="Describe your project, its goals, and impact"
                rows={6}
                disabled={isSubmitting}
              />
            </Form.Item>

            <Form.Item
              label="Metadata URI (IPFS)"
              name="metadataURI"
              rules={[
                { required: true, message: 'Please enter metadata URI' },
                { pattern: /^ipfs:\/\//, message: 'Must start with ipfs://' },
              ]}
            >
              <AntInput
                placeholder="ipfs://QmExample..."
                size="large"
                disabled={isSubmitting}
              />
            </Form.Item>

            <Form.Item
              label="Project Logo URL (Optional)"
              name="logoUrl"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || /^https?:\/\/.+/.test(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Please enter a valid URL'));
                  },
                },
              ]}
            >
              <AntInput
                placeholder="https://example.com/logo.png"
                size="large"
                disabled={isSubmitting}
              />
            </Form.Item>

            {/* Info Card */}
            <Card className="mb-6 bg-muted/50 border-border">
              <div className="text-sm space-y-2">
                <p className="font-semibold text-foreground">Before submitting:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Ensure your metadata is properly formatted and hosted on IPFS</li>
                  <li>Your project will be reviewed by administrators</li>
                  <li>Verification typically takes 24-48 hours</li>
                  <li>You'll be notified once your project is approved</li>
                </ul>
              </div>
            </Card>

            <Form.Item>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
