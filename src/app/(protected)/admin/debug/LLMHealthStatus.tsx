'use client';

import { Badge } from '@/components/ui/badge';
import { Database, Server, Cpu, Loader2 } from 'lucide-react';
import type { LLMHealthResponse, HealthStatus } from './llm-types';

interface LLMHealthStatusProps {
  health: LLMHealthResponse | null;
  isLoading: boolean;
}

const statusColors: Record<HealthStatus, string> = {
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  unhealthy: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  no_workers: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export function LLMHealthStatus({ health, isLoading }: LLMHealthStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking service health...</span>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Unable to fetch health status</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Service Health:</span>
        <Badge
          className={
            health.status === 'healthy'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : health.status === 'degraded'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }
        >
          {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Database Health */}
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Database:</span>
          <Badge className={statusColors[health.services.database.status]}>
            {health.services.database.status}
          </Badge>
          {health.services.database.type && (
            <span className="text-xs text-muted-foreground">({health.services.database.type})</span>
          )}
          {health.services.database.error && (
            <span className="text-xs text-red-600 dark:text-red-400" title={health.services.database.error}>
              ⚠ {health.services.database.error}
            </span>
          )}
        </div>

        {/* Redis Health */}
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Redis:</span>
          <Badge className={statusColors[health.services.redis.status]}>
            {health.services.redis.status}
          </Badge>
          {health.services.redis.error && (
            <span className="text-xs text-red-600 dark:text-red-400" title={health.services.redis.error}>
              ⚠ {health.services.redis.error}
            </span>
          )}
        </div>

        {/* Celery Health */}
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Celery:</span>
          <Badge className={statusColors[health.services.celery.status]}>
            {health.services.celery.status}
          </Badge>
          {health.services.celery.workers !== undefined && (
            <span className="text-xs text-muted-foreground">
              ({health.services.celery.workers} worker{health.services.celery.workers !== 1 ? 's' : ''})
            </span>
          )}
          {health.services.celery.error && (
            <span className="text-xs text-red-600 dark:text-red-400" title={health.services.celery.error}>
              ⚠ {health.services.celery.error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
