'use client';

/**
 * EmailPreview Component
 * Displays a preview of the share invitation email
 */

import React from 'react';
import { Mail, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SharePermission } from '@/types/plan-share';

interface EmailPreviewProps {
  planTitle: string;
  senderName: string;
  recipientEmail: string;
  permissions: SharePermission;
  customMessage?: string;
  className?: string;
}

export function EmailPreview({
  planTitle,
  senderName,
  recipientEmail,
  permissions,
  customMessage,
  className,
}: EmailPreviewProps): React.JSX.Element {
  return (
    <Card className={cn('p-6 bg-muted/30', className)}>
      {/* Email header */}
      <div className="mb-4 flex items-start gap-3 border-b pb-4">
        <div className="rounded-full bg-primary/10 p-2">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">From:</span>
            <span className="text-sm text-muted-foreground">
              {senderName} &lt;noreply@beprepared.ai&gt;
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-medium">To:</span>
            <span className="text-sm text-muted-foreground">{recipientEmail}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-medium">Subject:</span>
            <span className="text-sm">{senderName} shared an emergency plan with you</span>
          </div>
        </div>
      </div>

      {/* Email body preview */}
      <div className="space-y-4 text-sm">
        {/* Greeting */}
        <p>Hi there,</p>

        {/* Main message */}
        <p>
          <strong>{senderName}</strong> has shared the emergency plan "
          <strong>{planTitle}</strong>" with you on BePrep ared.ai.
        </p>

        {/* Custom message if provided */}
        {customMessage && (
          <div className="my-4 rounded-lg border-l-4 border-primary bg-primary/5 p-4">
            <p className="text-sm italic text-muted-foreground">
              "{customMessage}"
            </p>
          </div>
        )}

        {/* Permission info */}
        <div className="flex items-center gap-2">
          <span>You have been granted:</span>
          <Badge variant={permissions === 'edit' ? 'default' : 'secondary'}>
            {permissions === 'view' ? 'View Only' : 'Edit'} Access
          </Badge>
        </div>

        {/* CTA Button */}
        <div className="my-6 flex justify-center">
          <Button className="pointer-events-none">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Emergency Plan
          </Button>
        </div>

        {/* Additional info */}
        <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
          <p className="font-medium mb-2">Important Information:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>This share link will expire in 30 days</li>
            <li>
              You {permissions === 'edit' ? 'can view and modify' : 'can only view'} this
              emergency plan
            </li>
            <li>Access this plan anytime by clicking the link in this email</li>
          </ul>
        </div>

        {/* Sign-up CTA for free users */}
        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="font-medium text-sm mb-2">Don't have a BePrepared.ai account?</p>
          <p className="text-xs text-muted-foreground mb-3">
            Create your own personalized emergency plans with AI-powered recommendations.
          </p>
          <Button size="sm" variant="outline" className="pointer-events-none">
            Get Started Free
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t pt-4 text-xs text-muted-foreground">
          <p>
            This email was sent because {senderName} shared an emergency plan with you on
            BePrepared.ai.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} BePrepared.ai • Your AI Emergency Planning Assistant
          </p>
        </div>
      </div>
    </Card>
  );
}
