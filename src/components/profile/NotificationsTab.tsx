"use client";

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Megaphone, GraduationCap, Phone, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { updateEmailPreferences } from '@/app/actions/profile';

interface EmailPreferences {
  newsletterOptIn: boolean;
  marketingEmailsOptIn: boolean;
  systemEmailsOptIn: boolean;
  dripCampaignsOptIn: boolean;
  callRemindersOptIn: boolean;
}

interface NotificationsTabProps {
  initialPreferences: EmailPreferences;
  userId: string;
}

export function NotificationsTab({ initialPreferences, userId }: NotificationsTabProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (key: keyof EmailPreferences) => {
    // Prevent toggling system emails (always required)
    if (key === 'systemEmailsOptIn') {
      return;
    }

    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);

    startTransition(async () => {
      const result = await updateEmailPreferences(userId, newPreferences);
      if (result.success) {
        toast.success('Preferences updated', {
          description: 'Your email preferences have been saved.',
        });
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to update preferences',
        });
        // Rollback on error
        setPreferences(preferences);
      }
    });
  };

  const handleUnsubscribeAll = () => {
    const allOff = {
      newsletterOptIn: false,
      marketingEmailsOptIn: false,
      dripCampaignsOptIn: false,
      callRemindersOptIn: false,
      systemEmailsOptIn: true, // Keep system emails always enabled
    };

    setPreferences(allOff);
    startTransition(async () => {
      const result = await updateEmailPreferences(userId, allOff);
      if (result.success) {
        toast.success('Unsubscribed', {
          description: 'You have been unsubscribed from all marketing emails.',
        });
      } else {
        toast.error('Error', {
          description: result.error || 'Failed to unsubscribe',
        });
        // Rollback on error
        setPreferences(preferences);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Email Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage your email communication preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Newsletter */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <Label htmlFor="newsletter" className="flex items-center gap-2 text-base cursor-pointer">
              <Mail className="w-4 h-4" />
              Weekly Newsletter
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive our weekly emergency preparedness tips and updates
            </p>
          </div>
          <Switch
            isSelected={preferences.newsletterOptIn}
            onChange={() => handleToggle('newsletterOptIn')}
            disabled={isPending}
          />
        </div>

        <Separator />

        {/* Marketing Emails */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <Label htmlFor="marketing" className="flex items-center gap-2 text-base cursor-pointer">
              <Megaphone className="w-4 h-4" />
              Marketing & Promotional Emails
            </Label>
            <p className="text-sm text-muted-foreground">
              Special offers, new features, and product announcements
            </p>
          </div>
          <Switch
            isSelected={preferences.marketingEmailsOptIn}
            onChange={() => handleToggle('marketingEmailsOptIn')}
            disabled={isPending}
          />
        </div>

        <Separator />

        {/* Educational Drip */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <Label htmlFor="drip" className="flex items-center gap-2 text-base cursor-pointer">
              <GraduationCap className="w-4 h-4" />
              Educational Drip Campaigns
            </Label>
            <p className="text-sm text-muted-foreground">
              Step-by-step emergency planning guides and educational series
            </p>
          </div>
          <Switch
            isSelected={preferences.dripCampaignsOptIn}
            onChange={() => handleToggle('dripCampaignsOptIn')}
            disabled={isPending}
          />
        </div>

        <Separator />

        {/* Expert Call Reminders */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <Label htmlFor="calls" className="flex items-center gap-2 text-base cursor-pointer">
              <Phone className="w-4 h-4" />
              Expert Call Reminders
            </Label>
            <p className="text-sm text-muted-foreground">
              Notifications about scheduled consultations and expert sessions
            </p>
          </div>
          <Switch
            isSelected={preferences.callRemindersOptIn}
            onChange={() => handleToggle('callRemindersOptIn')}
            disabled={isPending}
          />
        </div>

        <Separator />

        {/* System & Account Emails */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <Label htmlFor="system" className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4" />
              System & Account Emails
            </Label>
            <p className="text-sm text-muted-foreground">
              Critical account notifications (password changes, security alerts) - Cannot be disabled
            </p>
          </div>
          <Switch
            isSelected={preferences.systemEmailsOptIn}
            disabled={true}
          />
        </div>

        <Separator />

        {/* Unsubscribe All Action */}
        <div className="pt-4">
          <Button
            variant="outline"
            onClick={handleUnsubscribeAll}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Unsubscribe from All Marketing Emails
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will turn off all marketing communications while keeping essential system emails
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
