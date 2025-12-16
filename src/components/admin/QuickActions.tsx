/**
 * Quick Actions - Admin dashboard navigation shortcuts
 * Provides one-click access to main admin tools
 */

import Link from 'next/link';
import { Boxes, Tags, Users, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuickActions() {
  const actions = [
    { label: 'Manage Bundles', href: '/admin/bundles', icon: Boxes, color: 'text-primary' },
    { label: 'Manage Products', href: '/admin/products', icon: Tags, color: 'text-success' },
    { label: 'View Users', href: '/admin/users', icon: Users, color: 'text-warning' },
    { label: 'Email Campaigns', href: '/admin/email', icon: Mail, color: 'text-destructive' },
    { label: 'Schedule Calls', href: '/admin/calls', icon: Calendar, color: 'text-primary' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Button
                variant="outline"
                className="w-full h-auto flex flex-col items-center gap-2 py-4 hover:bg-muted"
              >
                <Icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-xs font-medium text-foreground text-center">
                  {action.label}
                </span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
