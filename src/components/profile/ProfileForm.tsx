"use client";

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserProfile } from '@/app/actions/profile';
import { TIMEZONES } from '@/lib/timezones';
import { TierBadge } from './TierBadge';
import { Mail, Shield, Calendar, User as UserIcon, MapPin, Phone, Globe } from 'lucide-react';

interface ProfileFormProps {
  initialData: {
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    birthYear: number | null;
    gender: string | null;
    location: string | null;
    phone: string | null;
    timezone: string | null;
    subscriptionTier: string;
    createdAt: Date;
    newsletterOptIn: boolean;
    marketingEmailsOptIn: boolean;
    systemEmailsOptIn: boolean;
    dripCampaignsOptIn: boolean;
    callRemindersOptIn: boolean;
  };
  userId: string;
}

export function ProfileForm({ initialData, userId }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    birthYear: initialData.birthYear?.toString() || '',
    gender: initialData.gender || 'prefer_not_to_say',
    location: initialData.location || '',
    phone: initialData.phone || '',
    timezone: initialData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const saveProfile = async (): Promise<void> => {
    startTransition(async () => {
      // Auto-calculate fullName from firstName and lastName
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      const result = await updateUserProfile(userId, {
        fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthYear: formData.birthYear ? parseInt(formData.birthYear, 10) : null,
        gender: formData.gender,
        location: formData.location,
        phone: formData.phone,
        timezone: formData.timezone,
      });

      if (result.success) {
        toast.success('Profile updated');
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    });
  };

  const handleBlur = (): void => {
    // Save profile when any field loses focus
    saveProfile();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Account Information (Read-Only) */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <Shield className="w-5 h-5 text-primary" strokeWidth={2.5} aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Account Information</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Email - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              Email Address
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={initialData.email}
                disabled
                className="bg-slate-100 dark:bg-slate-950 cursor-not-allowed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">Email cannot be changed</p>
          </div>

          {/* Current Tier - Read Only */}
          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-300">Current Plan</Label>
            <div className="h-10 flex items-center pl-1">
              <TierBadge
                tier={initialData.subscriptionTier as 'FREE' | 'BASIC' | 'PRO'}
                size="md"
              />
            </div>
          </div>
        </div>

        {/* Account Created */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <Label className="text-slate-700 dark:text-slate-300">Member Since</Label>
          </div>
          <p className="text-sm text-slate-900 dark:text-slate-100 font-medium mt-2 pl-6">
            {new Date(initialData.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <UserIcon className="w-5 h-5 text-primary" strokeWidth={2.5} aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Personal Information</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-300">
              First Name <span className="text-red-500 dark:text-red-400 font-bold">*</span>
            </Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              onBlur={handleBlur}
              placeholder="John"
              required
              className="border-slate-300 dark:border-slate-700 focus-visible:ring-primary"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-300">
              Last Name <span className="text-red-500 dark:text-red-400 font-bold">*</span>
            </Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              onBlur={handleBlur}
              placeholder="Doe"
              required
              className="border-slate-300 dark:border-slate-700 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Birth Year */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="birthYear" className="text-slate-700 dark:text-slate-300">Birth Year <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">(Optional)</span></Label>
          <Input
            id="birthYear"
            type="number"
            value={formData.birthYear}
            onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
            onBlur={handleBlur}
            placeholder="1990"
            min="1900"
            max={new Date().getFullYear()}
            className="border-slate-300 dark:border-slate-700 focus-visible:ring-primary"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            <span>Used for age-specific preparedness recommendations</span>
          </p>
        </div>

        {/* Gender */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="gender" className="text-slate-700 dark:text-slate-300">
            Gender <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">(Optional)</span>
          </Label>
          <Select
            value={formData.gender}
            onValueChange={(val) => {
              setFormData({ ...formData, gender: val });
              // Save profile with the new value directly (state update is async)
              startTransition(async () => {
                const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
                const result = await updateUserProfile(userId, {
                  fullName,
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  birthYear: formData.birthYear ? parseInt(formData.birthYear, 10) : null,
                  gender: val, // Use the new value directly
                  location: formData.location,
                  phone: formData.phone,
                  timezone: formData.timezone,
                });
                if (result.success) {
                  toast.success('Gender updated');
                } else {
                  toast.error(result.error || 'Failed to update gender');
                }
              });
            }}
          >
            <SelectTrigger id="gender" className="border-slate-300 dark:border-slate-700 focus-visible:ring-primary">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            <span>Used for personalized preparedness recommendations</span>
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
          <MapPin className="w-5 h-5 text-primary" strokeWidth={2.5} aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Contact Information</h2>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-slate-700 dark:text-slate-300">
            Location <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">(Optional)</span>
          </Label>
          <Input
            id="location"
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            onBlur={handleBlur}
            placeholder="City, State or Zip Code"
            className="border-slate-300 dark:border-slate-700 focus-visible:ring-primary"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            <span>Used for location-specific preparedness recommendations</span>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              Phone Number <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">(Optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              onBlur={handleBlur}
              placeholder="(555) 123-4567"
              className="border-slate-300 dark:border-slate-700 focus-visible:ring-primary"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              Timezone
            </Label>
            <Select
              value={formData.timezone}
              onValueChange={(val) => {
                setFormData({ ...formData, timezone: val });
                saveProfile();
              }}
            >
              <SelectTrigger id="timezone" className="border-slate-300 dark:border-slate-700 focus-visible:ring-primary">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

    </div>
  );
}


