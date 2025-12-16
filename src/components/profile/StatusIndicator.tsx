import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

interface StatusIndicatorProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusIndicator({ status, size = 'md' }: StatusIndicatorProps) {
  const statusConfig = {
    active: {
      label: 'Active',
      icon: CheckCircle2,
      classes: 'text-green-600 dark:text-green-400',
    },
    canceled: {
      label: 'Canceled',
      icon: XCircle,
      classes: 'text-red-600 dark:text-red-400',
    },
    past_due: {
      label: 'Past Due',
      icon: AlertCircle,
      classes: 'text-yellow-600 dark:text-yellow-400',
    },
    trialing: {
      label: 'Trial',
      icon: Clock,
      classes: 'text-blue-600 dark:text-blue-400',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className={cn('flex items-center gap-1.5 font-medium', config.classes, sizeClasses)}>
      <Icon className={iconSize} />
      {config.label}
    </div>
  );
}

