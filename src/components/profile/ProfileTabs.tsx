"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { User, CreditCard, Activity, Receipt, Bell, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileTabsProps {
  activeTab: 'profile' | 'subscription' | 'usage' | 'billing' | 'notifications' | 'account';
}

export function ProfileTabs({ activeTab }: ProfileTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tab: string): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/profile?${params.toString()}`);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', shortLabel: 'Profile', Icon: User },
    { id: 'subscription', label: 'Subscription', shortLabel: 'Plan', Icon: CreditCard },
    { id: 'usage', label: 'Usage', shortLabel: 'Usage', Icon: Activity },
    { id: 'billing', label: 'Billing History', shortLabel: 'Billing', Icon: Receipt },
    { id: 'notifications', label: 'Notifications', shortLabel: 'Alerts', Icon: Bell },
    { id: 'account', label: 'Account', shortLabel: 'Account', Icon: Shield },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
      <nav
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
        aria-label="Profile tabs"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.Icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              title={tab.label}
              className={cn(
                'group relative flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-semibold transition-all duration-200 snap-start',
                'min-w-[48px] sm:min-w-[90px] lg:flex-1',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-md border-2 border-primary/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
                )}
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span className="hidden sm:inline lg:inline">{tab.shortLabel}</span>
              <span className="hidden lg:inline">{tab.label !== tab.shortLabel ? tab.label.replace(tab.shortLabel, '') : ''}</span>

              {/* Mobile tooltip on hover/focus */}
              <span className="sm:hidden absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}


