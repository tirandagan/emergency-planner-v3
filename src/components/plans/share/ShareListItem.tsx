'use client';

/**
 * ShareListItem Component
 * Displays a single share with actions (copy link, revoke, view details)
 */

import React, { useState } from 'react';
import { Copy, Trash2, Eye, Edit, Clock, Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { toast } from 'sonner';
import { resendShareEmail } from '@/app/actions/plans';
import type { SharePermission } from '@/types/plan-share';

interface ShareListItemProps {
  share: {
    id: string;
    shareToken: string;
    sharedWithEmail: string;
    permissions: SharePermission;
    expiresAt: Date;
    createdAt: Date;
    accessedAt?: Date | null;
    isDisabled: boolean;
    disabledReason?: string | null;
  };
  onRevoke: (shareId: string) => Promise<void>;
  onReactivate?: (shareId: string) => Promise<void>;
  className?: string;
}

export function ShareListItem({
  share,
  onRevoke,
  onReactivate,
  className,
}: ShareListItemProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const shareLink = `${window.location.origin}/shared/${share.shareToken}`;
  const isExpired = isPast(new Date(share.expiresAt));
  const isInactive = share.isDisabled || isExpired;

  const handleCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (): Promise<void> => {
    setIsRevoking(true);
    try {
      await onRevoke(share.id);
      setShowRevokeDialog(false);
    } catch (error) {
      console.error('Error revoking share:', error);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleReactivate = async (): Promise<void> => {
    if (!onReactivate) return;

    setIsReactivating(true);
    try {
      await onReactivate(share.id);
    } catch (error) {
      console.error('Error reactivating share:', error);
    } finally {
      setIsReactivating(false);
    }
  };

  const handleResendEmail = async (): Promise<void> => {
    setIsResending(true);
    try {
      const result = await resendShareEmail(share.id);
      if (result.success) {
        toast.success(`Invitation email resent to ${share.sharedWithEmail}`);
      } else {
        // Check if it's a rate limit error
        if (result.error?.includes('wait')) {
          toast.warning(result.error, { duration: 4000 });
        } else {
          toast.error(result.error || 'Failed to resend email');
        }
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error('An error occurred while resending email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'rounded-lg border bg-card p-4 transition-colors',
          isInactive && 'opacity-60 border-dashed',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Share info */}
          <div className="flex-1 space-y-2">
            {/* Email and status */}
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{share.sharedWithEmail}</span>

              {/* Status badges */}
              {share.isDisabled && (
                <Badge variant="destructive" className="text-xs">
                  Disabled
                </Badge>
              )}
              {isExpired && !share.isDisabled && (
                <Badge variant="secondary" className="text-xs">
                  Expired
                </Badge>
              )}
              {!isInactive && share.accessedAt && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Accessed
                </Badge>
              )}
            </div>

            {/* Permission and dates */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {/* Permission level */}
              <div className="flex items-center gap-1">
                {share.permissions === 'view' ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <Edit className="h-3.5 w-3.5" />
                )}
                <span>{share.permissions === 'view' ? 'View only' : 'Can edit'}</span>
              </div>

              {/* Created date */}
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Shared {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}</span>
              </div>

              {/* Expiration */}
              <div className="flex items-center gap-1">
                {isExpired ? (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-destructive">
                      Expired {formatDistanceToNow(new Date(share.expiresAt), { addSuffix: true })}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Expires {formatDistanceToNow(new Date(share.expiresAt), { addSuffix: true })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Access info */}
            {share.accessedAt && (
              <div className="text-xs text-muted-foreground">
                Last accessed {format(new Date(share.accessedAt), 'PPp')}
              </div>
            )}

            {/* Disabled reason */}
            {share.isDisabled && share.disabledReason && (
              <div className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>
                  Disabled due to:{' '}
                  {share.disabledReason === 'tier_downgrade'
                    ? 'Subscription tier downgrade'
                    : share.disabledReason.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-2">
            {/* Reactivate button (only for disabled shares) */}
            {share.isDisabled && onReactivate && !isExpired && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReactivate}
                disabled={isReactivating}
              >
                {isReactivating ? 'Reactivating...' : 'Reactivate'}
              </Button>
            )}

            {/* Resend email button (only for active shares) */}
            {!isInactive && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResendEmail}
                disabled={isResending}
              >
                <Send className="mr-2 h-4 w-4" />
                {isResending ? 'Sending...' : 'Resend Email'}
              </Button>
            )}

            {/* Copy link button */}
            {!isInactive && (
              <Button size="sm" variant="outline" onClick={handleCopyLink}>
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            )}

            {/* Revoke button */}
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowRevokeDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Revoke
            </Button>
          </div>
        </div>
      </div>

      {/* Revoke confirmation dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Share Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove access for <strong>{share.sharedWithEmail}</strong>.
              They will no longer be able to view or edit this plan using the share link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking ? 'Revoking...' : 'Revoke Access'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
