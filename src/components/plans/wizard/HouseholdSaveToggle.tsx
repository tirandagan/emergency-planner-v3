"use client";

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface HouseholdSaveToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  onOpenHelp: () => void;
}

export function HouseholdSaveToggle({ value, onChange, onOpenHelp }: HouseholdSaveToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
      <div className="flex items-center gap-3">
        <Switch
          isSelected={value}
          onChange={onChange}
        >
          <Label
            htmlFor="save-household-preference"
            className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
          >
            Save selections to profile
          </Label>
        </Switch>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onOpenHelp}
        className="shrink-0 h-8 w-8 p-0"
        aria-label="Learn more about saving household members"
      >
        <HelpCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </Button>
    </div>
  );
}
