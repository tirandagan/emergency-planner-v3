'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ConsultingService } from '@/db/schema/consulting';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConsultingServiceCardProps {
  service: ConsultingService;
  /** Optional bundle context for analytics */
  bundleContext?: {
    bundleId: string;
    bundleName: string;
  };
  /** Callback when user clicks "Get Started" */
  onGetStarted?: (serviceId: string) => void;
}

export function ConsultingServiceCard({ service, bundleContext, onGetStarted }: ConsultingServiceCardProps): React.JSX.Element {
  const router = useRouter();

  const handleGetStarted = (): void => {
    if (onGetStarted) {
      onGetStarted(service.id);
    } else {
      // Default behavior: navigate to booking flow
      router.push(`/consulting/booking/${service.id}`);
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{service.name}</CardTitle>
          {service.isGeneric && (
            <Badge variant="secondary" className="shrink-0">
              General
            </Badge>
          )}
          {bundleContext && (
            <Badge variant="outline" className="shrink-0">
              Bundle Offer
            </Badge>
          )}
        </div>
        <CardDescription className="text-base mt-2">
          {service.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow">
        {service.targetScenarios && service.targetScenarios.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Relevant for:</p>
            <div className="flex flex-wrap gap-2">
              {service.targetScenarios.map((scenario) => (
                <Badge key={scenario} variant="outline" className="capitalize">
                  {scenario.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleGetStarted}
          className="w-full group"
          size="lg"
        >
          Get Started
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
