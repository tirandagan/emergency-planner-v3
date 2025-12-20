'use client';

import React from 'react';
import { ConsultingServiceCard } from './ConsultingServiceCard';
import type { ConsultingService } from '@/db/schema/consulting';

interface ConsultingServicesListProps {
  services: ConsultingService[];
  /** Optional empty state component */
  emptyState?: React.ReactNode;
  /** Optional bundle context for analytics */
  bundleContext?: {
    bundleId: string;
    bundleName: string;
  };
  /** Callback when user clicks "Get Started" on any service */
  onServiceSelected?: (serviceId: string) => void;
}

export function ConsultingServicesList({
  services,
  emptyState,
  bundleContext,
  onServiceSelected,
}: ConsultingServicesListProps): React.JSX.Element {
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {emptyState || (
          <div className="space-y-2">
            <p className="text-lg font-medium text-muted-foreground">
              No consulting services available
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later for expert guidance opportunities
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <ConsultingServiceCard
          key={service.id}
          service={service}
          bundleContext={bundleContext}
          onGetStarted={onServiceSelected}
        />
      ))}
    </div>
  );
}
