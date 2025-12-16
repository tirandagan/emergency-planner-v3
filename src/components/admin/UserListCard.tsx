'use client';

import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserListCardProps {
  user: {
    id: string;
    fullName: string | null;
    email: string;
    subscriptionTier: string;
    isHighValue: boolean;
    lastActiveAt: Date | null;
    plansCreated: number;
  };
  onClick: (userId: string) => void;
}

export default function UserListCard({ user, onClick }: UserListCardProps) {
  // Get initials for avatar
  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  // Tier badge color
  const tierColor =
    {
      FREE: 'bg-gray-500',
      BASIC: 'bg-blue-500',
      PRO: 'bg-purple-500',
    }[user.subscriptionTier] || 'bg-gray-500';

  // Format last active
  const lastActive = user.lastActiveAt
    ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
    : 'Never';

  return (
    <div
      onClick={() => onClick(user.id)}
      className="relative p-6 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* High-value indicator */}
      {user.isHighValue && (
        <div className="absolute top-3 right-3">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
            {user.fullName || 'No name'}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      {/* Tier badge */}
      <div className="mb-3">
        <Badge className={`${tierColor} text-white`}>{user.subscriptionTier}</Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Plans Created</p>
          <p className="font-medium">{user.plansCreated}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Last Active</p>
          <p className="font-medium truncate">{lastActive}</p>
        </div>
      </div>
    </div>
  );
}
