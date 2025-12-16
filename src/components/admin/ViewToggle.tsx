'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Table } from 'lucide-react';

interface ViewToggleProps {
  onViewChange: (view: 'card' | 'table') => void;
}

export default function ViewToggle({ onViewChange }: ViewToggleProps) {
  // Initialize state from localStorage
  const [currentView, setCurrentView] = useState<'card' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('admin-users-view-mode');
      return (savedView as 'card' | 'table') || 'card';
    }
    return 'card';
  });

  // Notify parent of initial view preference
  useEffect(() => {
    onViewChange(currentView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleView = () => {
    const newView = currentView === 'card' ? 'table' : 'card';
    setCurrentView(newView);
    localStorage.setItem('admin-users-view-mode', newView);
    onViewChange(newView);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={currentView === 'card' ? 'default' : 'outline'}
        size="sm"
        onClick={toggleView}
      >
        <LayoutGrid className="w-4 h-4 mr-2" />
        Card Grid
      </Button>
      <Button
        variant={currentView === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={toggleView}
      >
        <Table className="w-4 h-4 mr-2" />
        Table
      </Button>
    </div>
  );
}
