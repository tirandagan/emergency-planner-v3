'use client';

import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface UserListTableProps {
  users: Array<{
    id: string;
    fullName: string | null;
    email: string;
    subscriptionTier: string;
    isHighValue: boolean;
    lastActiveAt: Date | string | null;
    createdAt: Date | string;
    plansCreated: number;
  }>;
  onUserClick: (userId: string) => void;
}

export default function UserListTable({ users, onUserClick }: UserListTableProps) {
  // Tier badge color
  const getTierColor = (tier: string) => {
    return (
      {
        FREE: 'bg-gray-500',
        BASIC: 'bg-blue-500',
        PRO: 'bg-purple-500',
      }[tier] || 'bg-gray-500'
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-4 font-semibold text-sm">Name</th>
            <th className="text-left p-4 font-semibold text-sm">Email</th>
            <th className="text-left p-4 font-semibold text-sm">Tier</th>
            <th className="text-left p-4 font-semibold text-sm">Signup Date</th>
            <th className="text-left p-4 font-semibold text-sm">Last Active</th>
            <th className="text-left p-4 font-semibold text-sm">Plans</th>
            <th className="text-left p-4 font-semibold text-sm">High-Value</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              onClick={() => onUserClick(user.id)}
              className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <td className="p-4">
                <div className="font-medium">{user.fullName || 'No name'}</div>
              </td>
              <td className="p-4">
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </td>
              <td className="p-4">
                <Badge className={`${getTierColor(user.subscriptionTier)} text-white`}>
                  {user.subscriptionTier}
                </Badge>
              </td>
              <td className="p-4">
                <div className="text-sm">
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </div>
              </td>
              <td className="p-4">
                <div className="text-sm">
                  {user.lastActiveAt
                    ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
                    : 'Never'}
                </div>
              </td>
              <td className="p-4">
                <div className="text-sm font-medium">{user.plansCreated}</div>
              </td>
              <td className="p-4">
                {user.isHighValue && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No users found matching your filters.
        </div>
      )}
    </div>
  );
}
