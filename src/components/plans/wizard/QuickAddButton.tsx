"use client";

import React from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickAddButtonProps {
  onClick: () => void;
  memberCount: number;
}

export function QuickAddButton({ onClick, memberCount }: QuickAddButtonProps): React.ReactElement {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="w-full border-dashed hover:border-solid hover:bg-slate-50 dark:hover:bg-slate-900"
    >
      <History className="!w-4 !h-4" />
      Quick Add ({memberCount} saved {memberCount === 1 ? 'member' : 'members'})
    </Button>
  );
}
