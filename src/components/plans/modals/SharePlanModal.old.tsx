'use client';

/**
 * Share Plan Modal Component
 * Tier-gated plan sharing with email invitations and link generation
 */

import React, { useState } from 'react';
import { Share2, Copy, Mail, Link as LinkIcon, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { shareMissionReport } from '@/app/actions/plans';
import type { SharePermission } from '@/types/plan-share';

interface SharePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
  userTier: 'FREE' | 'BASIC' | 'PRO';
  currentShareCount: number;
}

export function SharePlanModal({
  isOpen,
  onClose,
  reportId,
  reportTitle,
  userTier,
  currentShareCount,
}: SharePlanModalProps): React.JSX.Element {
  const [emails, setEmails] = useState('');
  const [permissions, setPermissions] = useState<SharePermission>('view');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tierLimits = {
    FREE: 0,
    BASIC: 5,
    PRO: 50,
  };

  const tierLimit = tierLimits[userTier];
  const remainingShares = tierLimit - currentShareCount;
  const canShare = userTier !== 'FREE';

  const handleEmailShare = async (): Promise<void> => {
    setIsSharing(true);
    setError(null);
    setSuccess(false);

    try {
      // Parse and validate emails
      const emailList = emails
        .split(/[,\s]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (emailList.length === 0) {
        setError('Please enter at least one email address');
        setIsSharing(false);
        return;
      }

      if (emailList.length > remainingShares) {
        setError(`You can only share ${remainingShares} more times. You've entered ${emailList.length} emails.`);
        setIsSharing(false);
        return;
      }

      const result = await shareMissionReport(reportId, emailList, permissions);

      if (result.success) {
        setSuccess(true);
        setEmails('');
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to share plan');
      }
    } catch (err) {
      console.error('Error sharing plan:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async (): Promise<void> => {
    if (!shareLink) {
      // Generate a new share link
      setIsSharing(true);
      setError(null);

      try {
        const result = await shareMissionReport(reportId, ['public@share.link'], permissions);

        if (result.success && result.shares && result.shares[0]) {
          const token = result.shares[0].shareToken;
          const link = `${window.location.origin}/shared/${token}`;
          setShareLink(link);
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          setError(result.error || 'Failed to generate share link');
        }
      } catch (err) {
        console.error('Error generating share link:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsSharing(false);
      }
    } else {
      // Copy existing link
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Share Plan</DialogTitle>
          </div>
          <DialogDescription>
            Share "{reportTitle}" with others. You have {remainingShares} of {tierLimit} shares
            remaining.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="link">
              <LinkIcon className="h-4 w-4 mr-2" />
              Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <Input
                id="emails"
                placeholder="email@example.com, another@example.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                disabled={isSharing}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas or spaces
              </p>
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

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm p-3 rounded flex items-center gap-2">
                <Check className="h-4 w-4" />
                Plan shared successfully!
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSharing}>
                Cancel
              </Button>
              <Button onClick={handleEmailShare} disabled={isSharing || !emails.trim()}>
                {isSharing ? 'Sharing...' : 'Share via Email'}
              </Button>
            </div>
          </TabsContent>

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

            {shareLink && (
              <div className="bg-muted p-3 rounded text-sm break-all">
                {shareLink}
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">
                {error}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Link expires in 30 days. Anyone with the link can access the plan.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCopyLink} disabled={isSharing}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : shareLink ? 'Copy Link' : 'Generate Link'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
