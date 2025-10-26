import { RoundStatus } from '@/types';

interface StatusBadgeProps {
  status: RoundStatus;
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    className: 'bg-success/10 text-success border-success/20',
  },
  closed: {
    label: 'Closed',
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
  finalized: {
    label: 'Finalized',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
