import { LockOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

interface EncryptedBadgeProps {
  className?: string;
  showTooltip?: boolean;
}

export function EncryptedBadge({ className = '', showTooltip = true }: EncryptedBadgeProps) {
  const badge = (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium ${className}`}
    >
      <LockOutlined className="text-[10px]" />
      <span>FHE Encrypted</span>
    </div>
  );

  if (showTooltip) {
    return (
      <Tooltip title="Your data is encrypted using Fully Homomorphic Encryption">
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
