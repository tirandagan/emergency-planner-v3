'use client';

/**
 * Quick Stats Cards Component
 * Displays at-a-glance metrics from bundle recommendations
 */

import React, { useMemo } from 'react';
import { Package, DollarSign, CheckCircle2, Calendar } from 'lucide-react';
import type { ReportDataV2 } from '@/types/mission-report';

interface QuickStatsCardsProps {
  reportData: ReportDataV2;
  reportId: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  colorClass?: string;
}

function StatCard({ icon, label, value, subtitle, colorClass = 'text-primary' }: StatCardProps): React.JSX.Element {
  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={`text-2xl sm:text-3xl font-bold mt-2 ${colorClass}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`${colorClass} opacity-80`}>{icon}</div>
      </div>
    </div>
  );
}

export function QuickStatsCards({ reportData }: QuickStatsCardsProps): React.JSX.Element {
  const stats = useMemo(() => {
    const bundles = reportData.sections.bundles || [];
    const ownedItems = reportData.ownedItems || {};
    const familySize = (reportData.formData as any).familySize || 1;

    // Calculate total items across all bundles
    const totalItems = bundles.reduce((sum, bundle) => sum + bundle.itemCount, 0);

    // Calculate estimated cost
    const estimatedCost = bundles.reduce((sum, bundle) => sum + bundle.price, 0);

    // Calculate items owned
    let ownedCount = 0;
    for (const bundleId in ownedItems) {
      const bundleOwnedItems = ownedItems[bundleId];
      for (const itemId in bundleOwnedItems) {
        if (bundleOwnedItems[itemId]) {
          ownedCount++;
        }
      }
    }

    // Calculate estimated days of supplies
    // Simplified calculation: assume standard 72-hour kits per person
    const daysOfSupplies = bundles.length > 0 ? Math.floor((bundles.length * 3) / familySize) : 0;

    return {
      totalItems,
      estimatedCost,
      ownedCount,
      daysOfSupplies,
      ownershipPercentage: totalItems > 0 ? Math.round((ownedCount / totalItems) * 100) : 0,
    };
  }, [reportData]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={<Package className="h-8 w-8" />}
        label="Total Items"
        value={stats.totalItems.toString()}
        subtitle={`Across ${reportData.sections.bundles?.length || 0} bundles`}
        colorClass="text-primary"
      />
      <StatCard
        icon={<DollarSign className="h-8 w-8" />}
        label="Estimated Cost"
        value={`$${stats.estimatedCost.toLocaleString()}`}
        subtitle="Total for all bundles"
        colorClass="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        icon={<CheckCircle2 className="h-8 w-8" />}
        label="Items Owned"
        value={`${stats.ownedCount}/${stats.totalItems}`}
        subtitle={`${stats.ownershipPercentage}% complete`}
        colorClass="text-green-600 dark:text-green-400"
      />
      <StatCard
        icon={<Calendar className="h-8 w-8" />}
        label="Days of Supplies"
        value={stats.daysOfSupplies.toString()}
        subtitle={`For ${(reportData.formData as any).familySize || 1} people`}
        colorClass="text-orange-600 dark:text-orange-400"
      />
    </div>
  );
}
