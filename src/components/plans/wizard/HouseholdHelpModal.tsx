"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';

interface HouseholdHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HouseholdHelpModal({ isOpen, onClose }: HouseholdHelpModalProps): React.ReactElement {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Save Household Members to Your Profile</DialogTitle>
          <DialogDescription className="text-base text-slate-600 dark:text-slate-400">
            Streamline your emergency planning by saving your household configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            When enabled, this feature automatically saves the household members you configure to your user profile. This means:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Faster Plan Creation
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Your household configuration loads automatically the next time you create a plan
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Consistent Information
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Ensure medical conditions and special needs are always included
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Easy Updates
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Changes you make in future plans update your saved configuration automatically
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              How It Works
            </p>
            <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">1.</span>
                <span>Toggle &ldquo;Save selections to profile&rdquo; ON (default)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">2.</span>
                <span>Configure your household members as usual</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">3.</span>
                <span>When you advance to the next step, your configuration is saved</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-slate-900 dark:text-slate-100">4.</span>
                <span>Next time you create a plan, use &ldquo;Quick Add&rdquo; to load your saved household members</span>
              </li>
            </ol>
          </div>

          <div className="mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              <strong>Note:</strong> This only affects future plan creation. Existing plans are not modified.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
