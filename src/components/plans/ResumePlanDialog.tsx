"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { FileText } from 'lucide-react';

const STORAGE_KEY = 'plan-wizard-state';

interface SavedPlanState {
  formData: Record<string, unknown>;
  currentStep: number;
  timestamp: number;
}

function loadSavedState(): SavedPlanState | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that the saved data has the expected structure
      if (parsed.formData && typeof parsed.currentStep === 'number') {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load saved wizard state:', error);
  }

  return null;
}

function clearSavedState(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear wizard state:', error);
  }
}

export function ResumePlanDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [savedState, setSavedState] = useState<SavedPlanState | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for saved state on mount
    const state = loadSavedState();
    
    // Only show dialog if there's saved state and it's not on the final generation step
    if (state && state.currentStep < 3) {
      setSavedState(state);
      setIsOpen(true);
    }
  }, []);

  const handleContinue = () => {
    setIsOpen(false);
    // Navigate to the wizard page which will automatically load the saved state
    router.push('/plans/new');
  };

  const handleDiscard = () => {
    clearSavedState();
    setIsOpen(false);
    setSavedState(null);
  };

  if (!savedState) {
    return null;
  }

  const stepNames = ['Scenarios', 'Personnel', 'Location & Context', 'Generate Plan'];
  const currentStepName = stepNames[savedState.currentStep] || 'Unknown';
  const savedDate = new Date(savedState.timestamp);
  const timeAgo = getTimeAgo(savedDate);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-primary/10 p-2">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle>Resume Your Plan?</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="text-left space-y-3 text-sm text-muted-foreground">
              <p>
                You have an unfinished emergency plan that you started {timeAgo}.
              </p>
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Current Progress:
                </p>
                <p className="text-sm text-muted-foreground">
                  Step {savedState.currentStep + 1} of 4 - {currentStepName}
                </p>
              </div>
              <p>
                Would you like to continue where you left off, or start fresh?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDiscard}>
            Discard & Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue}>
            Continue Plan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return `on ${date.toLocaleDateString()}`;
  }
}

