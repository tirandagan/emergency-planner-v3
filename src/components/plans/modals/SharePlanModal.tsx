'use client';

/**
 * Enhanced Share Plan Modal Component
 * Tier-gated plan sharing with email invitations, link generation, and share management
 */

import React, { useState, useEffect } from 'react';
import { Share2, Copy, Mail, Link as LinkIcon, Check, ChevronDown, ChevronUp, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  shareMissionReportWithEmail,
  getMissionReportShares,
  revokePlanShare,
  reactivatePlanShare,
  resendShareEmail,
} from '@/app/actions/plans';
import { EmailChipInput } from '../share/EmailChipInput';
import { ShareStatusBanner } from '../share/ShareStatusBanner';
import { ShareListItem } from '../share/ShareListItem';
import { EmailPreview } from '../share/EmailPreview';
import type { SharePermission } from '@/types/plan-share';
import { toast } from 'sonner';

interface SharePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
  userTier: 'FREE' | 'BASIC' | 'PRO';
  currentShareCount: number;
  senderName: string;
}

export function SharePlanModal({
  isOpen,
  onClose,
  reportId,
  reportTitle,
  userTier,
  currentShareCount: initialShareCount,
  senderName,
}: SharePlanModalProps): React.JSX.Element {
  const [emails, setEmails] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<SharePermission>('view');
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expirationDays, setExpirationDays] = useState('30');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [currentShareCount, setCurrentShareCount] = useState(initialShareCount);
  const [activeShares, setActiveShares] = useState<Array<{
    id: string;
    sharedWithEmail: string;
    shareToken: string;
    permissions: string;
    expiresAt: Date;
    createdAt: Date;
    accessedAt: Date | null;
    isDisabled: boolean;
    disabledReason: string | null;
  }>>([]);
  const [loadingShares, setLoadingShares] = useState(false);

  const tierLimits = {
    FREE: 0,
    BASIC: 5,
    PRO: 50,
  };

  const tierLimit = tierLimits[userTier];
  const remainingShares = Math.max(0, tierLimit - currentShareCount);
  const canShare = userTier !== 'FREE';

  // Load active shares when manage tab is accessed
  const loadActiveShares = async (): Promise<void> => {
    setLoadingShares(true);
    try {
      const result = await getMissionReportShares(reportId);
      if (result.success && result.shares) {
        setActiveShares(result.shares);
        setCurrentShareCount(result.shares.filter((s) => !s.isDisabled).length);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
      toast.error('Failed to load active shares');
    } finally {
      setLoadingShares(false);
    }
  };

  // Load shares when modal opens
  useEffect(() => {
    if (isOpen && canShare) {
      loadActiveShares();
    }
  }, [isOpen]);

  const handleEmailShare = async (): Promise<void> => {
    if (emails.length === 0) {
      toast.error('Please add at least one email address');
      return;
    }

    if (emails.length > remainingShares) {
      toast.error(`You can only share ${remainingShares} more times. You've entered ${emails.length} emails.`);
      return;
    }

    setIsSharing(true);

    try {
      const result = await shareMissionReportWithEmail(
        reportId,
        emails,
        permissions,
        customMessage || undefined
      );

      if (result.success) {
        const emailsSent = (result as any).emailsSent ?? emails.length;
        const emailsFailed = (result as any).emailsFailed ?? 0;

        if (emailsFailed > 0) {
          toast.warning(
            `Shares created but ${emailsFailed} email${emailsFailed > 1 ? 's' : ''} failed to send. Share links are still active.`,
            { duration: 5000 }
          );
        } else {
          toast.success(`Invitation emails sent to ${emails.length} recipient${emails.length > 1 ? 's' : ''}`);
        }

        setEmails([]);
        setCustomMessage('');
        await loadActiveShares();
      } else {
        toast.error(result.error || 'Failed to share plan');
      }
    } catch (err) {
      console.error('Error sharing plan:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async (): Promise<void> => {
    if (!shareLink) {
      // Generate a new share link
      setIsSharing(true);

      try {
        const result = await shareMissionReportWithEmail(
          reportId,
          [`link-share-${Date.now()}@internal.share`],
          permissions
        );

        if (result.success && result.shares && result.shares[0]) {
          const token = result.shares[0].shareToken;
          const link = `${window.location.origin}/shared/${token}`;
          setShareLink(link);
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          await loadActiveShares();
          toast.success('Share link has been copied to clipboard');
        } else {
          toast.error(result.error || 'Failed to generate share link');
        }
      } catch (err) {
        console.error('Error generating share link:', err);
        toast.error('An unexpected error occurred');
      } finally {
        setIsSharing(false);
      }
    } else {
      // Copy existing link
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Share link has been copied to clipboard');
    }
  };

  const handleRevokeShare = async (shareId: string): Promise<void> => {
    try {
      const result = await revokePlanShare(shareId);
      if (result.success) {
        toast.success('Share access has been removed');
        await loadActiveShares();
      } else {
        toast.error(result.error || 'Failed to revoke share');
      }
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleReactivateShare = async (shareId: string): Promise<void> => {
    try {
      const result = await reactivatePlanShare(shareId);
      if (result.success) {
        toast.success('Share access has been restored');
        await loadActiveShares();
      } else {
        toast.error(result.error || 'Failed to reactivate share');
      }
    } catch (error) {
      console.error('Error reactivating share:', error);
      toast.error('An unexpected error occurred');
    }
  };

  if (!canShare) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upgrade to Share Plans</DialogTitle>
            <DialogDescription>
              Sharing is available on Basic and Pro plans. Upgrade to share your plans with family
              and network contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-primary/10 p-4 rounded">
            <p className="text-sm font-medium">Plan sharing limits:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• <strong>Basic:</strong> 5 shares</li>
              <li>• <strong>Pro:</strong> 50 shares</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Maybe Later
            </Button>
            <Button onClick={() => (window.location.href = '/pricing')}>
              View Plans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Share Plan</DialogTitle>
          </div>
          <DialogDescription>
            Share "{reportTitle}" with others.
          </DialogDescription>
        </DialogHeader>

        {/* Share status banner */}
        <ShareStatusBanner
          currentShareCount={currentShareCount}
          tierLimit={tierLimit}
          tier={userTier}
        />

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="link">
              <LinkIcon className="h-4 w-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value="manage">
              <Users className="h-4 w-4 mr-2" />
              Manage ({activeShares.length})
            </TabsTrigger>
          </TabsList>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-chips">Email Addresses</Label>
              <EmailChipInput
                emails={emails}
                onChange={setEmails}
                maxEmails={remainingShares}
                disabled={isSharing || remainingShares === 0}
                placeholder="Enter email addresses..."
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <RadioGroup value={permissions} onValueChange={(v) => setPermissions(v as SharePermission)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="view" id="view" />
                  <Label htmlFor="view" className="font-normal">
                    View only - Can view the plan
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="edit" id="edit" />
                  <Label htmlFor="edit" className="font-normal">
                    Can edit - Can view and modify the plan
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-message">Personal Message (Optional)</Label>
              <Textarea
                id="custom-message"
                placeholder="Add a personal message to your invitation..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                disabled={isSharing}
              />
              <p className="text-xs text-muted-foreground">
                This message will be included in the email invitation
              </p>
            </div>

            {/* Email preview */}
            {emails.length > 0 && (
              <Collapsible open={showEmailPreview} onOpenChange={setShowEmailPreview}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    {showEmailPreview ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Hide Email Preview
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Preview Email
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <EmailPreview
                    planTitle={reportTitle}
                    senderName={senderName}
                    recipientEmail={emails[0]}
                    permissions={permissions}
                    customMessage={customMessage || undefined}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={isSharing}>
                Cancel
              </Button>
              <Button
                onClick={handleEmailShare}
                disabled={isSharing || emails.length === 0 || remainingShares === 0}
              >
                {isSharing ? 'Sharing...' : `Share with ${emails.length} ${emails.length === 1 ? 'Person' : 'People'}`}
              </Button>
            </div>
          </TabsContent>

          {/* Link Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Permissions</Label>
              <RadioGroup value={permissions} onValueChange={(v) => setPermissions(v as SharePermission)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="view" id="view-link" />
                  <Label htmlFor="view-link" className="font-normal">
                    View only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="edit" id="edit-link" />
                  <Label htmlFor="edit-link" className="font-normal">
                    Can edit
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration">Link Expiration</Label>
              <Select value={expirationDays} onValueChange={setExpirationDays}>
                <SelectTrigger id="expiration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days (Default)</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Anyone with the link can access the plan until it expires
              </p>
            </div>

            {shareLink && (
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="bg-muted p-3 rounded text-sm break-all font-mono">
                  {shareLink}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCopyLink}
                disabled={isSharing || remainingShares === 0}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    {shareLink ? 'Copy Link' : 'Generate Link'}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Manage Shares Tab */}
          <TabsContent value="manage" className="space-y-4">
            {loadingShares ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading shares...</div>
              </div>
            ) : activeShares.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No active shares</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share this plan via email or link to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Active Shares</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadActiveShares}
                  >
                    Refresh
                  </Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {activeShares.map((share) => (
                    <ShareListItem
                      key={share.id}
                      share={{
                        ...share,
                        permissions: share.permissions as SharePermission,
                      }}
                      onRevoke={handleRevokeShare}
                      onReactivate={handleReactivateShare}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
