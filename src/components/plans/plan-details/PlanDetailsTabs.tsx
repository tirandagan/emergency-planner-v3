'use client';

import { useState } from 'react';
import { FileText, Package, Shield, BookOpen, Calendar, Map, MapPin, Loader2 } from 'lucide-react';
import { OverviewTab } from './OverviewTab';
import { BundlesTab } from './BundlesTab';
import EmergencyContactsTab from './EmergencyContactsTab';
import MeetingLocationsTab from './MeetingLocationsTab';
import { SkillsTab } from './SkillsTab';
import { SimulationTab } from './SimulationTab';
import { MapTab } from './MapTab';
import { useRoutePolling } from '@/hooks/useRoutePolling';
import type { ReportDataV2 } from '@/types/mission-report';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PlanDetailsTabsProps {
  reportId: string;
  reportData: ReportDataV2;
  evacuationRoutes?: any; // From separate database field
  userTier?: string; // User subscription tier
  isSharedView?: boolean; // Flag for shared/public view (disables edit actions)
}

type TabId = 'overview' | 'bundles' | 'contacts' | 'meetings' | 'skills' | 'simulation' | 'map';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof FileText;
}

const staticTabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'bundles', label: 'Bundles', icon: Package },
  { id: 'contacts', label: 'Emergency Contacts', icon: Shield },
  { id: 'meetings', label: 'Meeting Locations', icon: MapPin },
  { id: 'skills', label: 'Skills', icon: BookOpen },
  { id: 'simulation', label: 'Simulation', icon: Calendar },
  { id: 'map', label: 'Map & Routes', icon: Map },
];

export function PlanDetailsTabs({
  reportId,
  reportData,
  evacuationRoutes,
  userTier = 'FREE',
  isSharedView = false
}: PlanDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [hasInteractedWithMap, setHasInteractedWithMap] = useState(false);

  // Check if routes already exist in the database field
  const existingRoutes = evacuationRoutes || [];
  const hasExistingRoutes = existingRoutes.length > 0;

  // Only start polling if user has interacted AND routes don't already exist
  const shouldPoll = hasInteractedWithMap && !hasExistingRoutes;
  const { routes, isLoading: isRoutesLoading } = useRoutePolling(reportId, {
    enabled: shouldPoll,
  });

  // Use existing routes if available, otherwise use polled routes
  const finalRoutes = hasExistingRoutes ? existingRoutes : routes;
  const finalIsLoading = hasExistingRoutes ? false : isRoutesLoading;

  // Determine if map tab should be disabled
  const isMapDisabled = shouldPoll && isRoutesLoading;

  return (
    <div>
      {/* Tab Navigation - Sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border mb-4">
        <nav className="flex gap-1 overflow-x-auto pb-px scrollbar-hide" aria-label="Tabs">
          {staticTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.id === 'map' && isMapDisabled;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'map') {
                    setHasInteractedWithMap(true);
                  }
                  if (!isDisabled) {
                    setActiveTab(tab.id);
                  }
                }}
                onMouseEnter={() => {
                  // Start polling when user hovers over map tab
                  if (tab.id === 'map') {
                    setHasInteractedWithMap(true);
                  }
                }}
                disabled={isDisabled}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Icon className="!h-4 !w-4" />
                {tab.label}
                {tab.id === 'map' && hasInteractedWithMap && finalIsLoading && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Loader2 className="!h-3 !w-3 animate-spin" />
                    Generating...
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab reportData={reportData} />}
        {activeTab === 'bundles' && <BundlesTab bundles={reportData.sections.bundles} />}
        {activeTab === 'contacts' && (
          <EmergencyContactsTab
            contacts={reportData.sections.emergencyContacts?.contacts || []}
            userTier={userTier}
            reportId={reportId}
          />
        )}
        {activeTab === 'meetings' && (
          <MeetingLocationsTab
            meetingLocations={reportData.sections.emergencyContacts?.meetingLocations || []}
            userTier={userTier}
            reportId={reportId}
            homeLocation={reportData.formData.location}
          />
        )}
        {activeTab === 'skills' && <SkillsTab skills={reportData.sections.skills} />}
        {activeTab === 'simulation' && (
          <SimulationTab
            simulation={reportData.sections.simulation}
            durationDays={reportData.formData.durationDays}
          />
        )}
        {activeTab === 'map' && (
          <MapTab
            location={reportData.formData.location}
            routes={finalRoutes}
            isLoading={finalIsLoading}
            error={null}
          />
        )}
      </div>
    </div>
  );
}
