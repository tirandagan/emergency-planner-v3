'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Database, Activity, Cpu, ExternalLink } from 'lucide-react';
import type { LLMHealthResponse } from './llm-types';

interface LLMHealthDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: LLMHealthResponse | null;
  serviceUrl: string;
}

export function LLMHealthDetailModal({ isOpen, onClose, health, serviceUrl }: LLMHealthDetailModalProps): React.ReactElement | null {
  if (!health) return null;

  const getStatusColor = (status?: string): string => {
    if (status === 'healthy') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const getStatusIcon = (status?: string): React.ReactElement => {
    if (status === 'healthy') return <CheckCircle2 className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LLM Service Health Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service URL */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Service URL</span>
              <a
                href={serviceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {serviceUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Overall Status */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Overall Status</span>
              <Badge className={getStatusColor(health.status)}>
                {getStatusIcon(health.status)}
                <span className="ml-1 capitalize">{health.status || 'unknown'}</span>
              </Badge>
            </div>
          </div>

          {/* Service Components */}
          {health.services && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">Service Components</h3>

              {/* Database */}
              {health.services.database && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Database (PostgreSQL)</span>
                    </div>
                    <Badge className={getStatusColor(health.services.database.status)}>
                      {getStatusIcon(health.services.database.status)}
                      <span className="ml-1 capitalize">{health.services.database.status || 'unknown'}</span>
                    </Badge>
                  </div>
                  {health.services.database.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 ml-6">
                      {health.services.database.error}
                    </p>
                  )}
                  {health.services.database.message && !health.services.database.error && (
                    <p className="text-xs text-muted-foreground ml-6">
                      {health.services.database.message}
                    </p>
                  )}
                </div>
              )}

              {/* Redis */}
              {health.services.redis && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Redis</span>
                    </div>
                    <Badge className={getStatusColor(health.services.redis.status)}>
                      {getStatusIcon(health.services.redis.status)}
                      <span className="ml-1 capitalize">{health.services.redis.status || 'unknown'}</span>
                    </Badge>
                  </div>
                  {health.services.redis.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 ml-6">
                      {health.services.redis.error}
                    </p>
                  )}
                  {health.services.redis.message && !health.services.redis.error && (
                    <p className="text-xs text-muted-foreground ml-6">
                      {health.services.redis.message}
                    </p>
                  )}
                </div>
              )}

              {/* Celery */}
              {health.services.celery && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Celery Worker
                        {health.services.celery.workers !== undefined && (
                          <span className="text-muted-foreground ml-1">
                            ({health.services.celery.workers} worker{health.services.celery.workers !== 1 ? 's' : ''})
                          </span>
                        )}
                      </span>
                    </div>
                    <Badge className={getStatusColor(health.services.celery.status)}>
                      {getStatusIcon(health.services.celery.status)}
                      <span className="ml-1 capitalize">{health.services.celery.status || 'unknown'}</span>
                    </Badge>
                  </div>
                  {health.services.celery.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 ml-6">
                      {health.services.celery.error}
                    </p>
                  )}
                  {health.services.celery.message && !health.services.celery.error && (
                    <p className="text-xs text-muted-foreground ml-6">
                      {health.services.celery.message}
                    </p>
                  )}
                  {health.services.celery.type && (
                    <p className="text-xs text-muted-foreground ml-6">
                      Type: {health.services.celery.type}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          {health.timestamp && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Last Checked</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(health.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Debug Info */}
          {health.message && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">Message: </span>
                <span className="text-foreground">{health.message}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
