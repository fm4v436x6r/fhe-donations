import { Link } from 'react-router-dom';
import { Card, Avatar } from 'antd';
import { CheckCircleFilled, UserOutlined, WalletOutlined, ProjectOutlined } from '@ant-design/icons';
import { Project } from '@/types';
import { Button } from './ui/button';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card
      className="card-shadow card-hover border-border h-full"
      styles={{
        body: { padding: 20 },
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar
            size={48}
            src={project.logoUrl}
            icon={<ProjectOutlined />}
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-base font-semibold text-foreground truncate">
                {project.name}
              </h3>
              {project.verified && (
                <CheckCircleFilled className="text-primary text-sm flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              by {project.creator.slice(0, 6)}...{project.creator.slice(-4)}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
          {project.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-t border-border">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <UserOutlined />
              <span>Donors</span>
            </div>
            <div className="text-base font-semibold text-foreground">
              {project.donorCount}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <WalletOutlined />
              <span>Raised</span>
            </div>
            <div className="text-base font-semibold text-foreground">
              {project.totalDonations}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link to={`/projects/${project.id}`} className="block">
          <Button className="w-full" variant="default">
            Donate Now
          </Button>
        </Link>
      </div>
    </Card>
  );
}
