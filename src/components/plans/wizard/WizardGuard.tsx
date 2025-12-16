'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExistingPlan {
  id: string;
  title: string;
  location: string | null;
  scenarios: string[];
  createdAt: Date;
}

interface WizardGuardProps {
  children: React.ReactNode;
}

const WIZARD_STORAGE_KEY = 'plan-wizard-state';

export function WizardGuard({ children }: WizardGuardProps) {
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [existingPlan, setExistingPlan] = useState<ExistingPlan | null>(null);
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    checkExistingPlan();
  }, []);

  const checkExistingPlan = async () => {
    try {
      const response = await fetch('/api/mission-plan/check');
      const data = await response.json();

      if (data.hasExistingPlan && data.existingPlan) {
        setExistingPlan(data.existingPlan);
        setShowWarning(true);
      } else {
        // No existing plan or not on free tier - proceed directly
        setCanProceed(true);
      }
    } catch (error) {
      console.error('Failed to check existing plan:', error);
      // On error, allow them to proceed
      setCanProceed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    // Clear any saved wizard state so user starts fresh
    try {
      localStorage.removeItem(WIZARD_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear wizard state:', error);
    }
    setShowWarning(false);
    setCanProceed(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-slate-600 dark:text-slate-400">Checking your plans...</p>
        </div>
      </div>
    );
  }

  if (!canProceed) {
    return (
      <>
        <Dialog open={showWarning} onOpenChange={setShowWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <DialogTitle className="text-xl">Replace Existing Plan?</DialogTitle>
              </div>
              <DialogDescription className="text-base">
                Free tier users can only have one active plan at a time. Creating a new
                plan will permanently delete your existing plan.
              </DialogDescription>
            </DialogHeader>

            {existingPlan && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Current Plan
                </h4>
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Title:
                    </span>{' '}
                    {existingPlan.title}
                  </div>
                  {existingPlan.location && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Location:
                      </span>{' '}
                      {existingPlan.location}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Created:
                    </span>{' '}
                    {new Date(existingPlan.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/dashboard')}
                className="sm:flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleProceed} className="sm:flex-1">
                Continue Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return <>{children}</>;
}
