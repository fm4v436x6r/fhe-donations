import { Link } from 'react-router-dom';
import { Card } from 'antd';
import { ClockCircleOutlined, ProjectOutlined } from '@ant-design/icons';
import { Round } from '@/types';
import { StatusBadge } from './StatusBadge';
import { EncryptedBadge } from './EncryptedBadge';
import { Button } from './ui/button';

interface RoundCardProps {
  round: Round;
}

export function RoundCard({ round }: RoundCardProps) {
  const daysLeft = Math.ceil((round.endTime - Date.now()) / (1000 * 60 * 60 * 24));
  const isActive = round.status === 'active';

  return (
    <Card
      className="card-shadow card-hover border-border"
      styles={{
        body: { padding: 24 },
      }}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">{round.name}</h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={round.status} />
              <EncryptedBadge />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-border">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Matching Pool</div>
            <div className="text-base font-semibold text-foreground">{round.matchingPool}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Projects</div>
            <div className="flex items-center gap-1.5 text-base font-semibold text-foreground">
              <ProjectOutlined className="text-primary" />
              {round.projectCount}
            </div>
          </div>
        </div>

        {/* Time Info */}
        {isActive && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClockCircleOutlined />
            <span>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Ends today'}
            </span>
          </div>
        )}

        {/* Donation Limits */}
        <div className="text-xs text-muted-foreground">
          Min: {round.minDonation} ETH • Max: {round.maxDonation} ETH
        </div>

        {/* Action Button */}
        <Link to={`/rounds/${round.id}`} className="block">
          <Button className="w-full" variant={isActive ? 'default' : 'outline'}>
            {isActive ? 'View Projects' : 'View Round'}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
