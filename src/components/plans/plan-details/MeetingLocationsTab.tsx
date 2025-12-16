'use client';

import React, { useState, useTransition } from 'react';
import type { MeetingLocationRecommendation } from '@/types/emergency-contacts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { regenerateEmergencyContacts } from '@/app/actions/regenerate-emergency-contacts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface MeetingLocationsTabProps {
  meetingLocations: MeetingLocationRecommendation[];
  userTier: string;
  reportId: string;
  homeLocation: {
    city: string;
    state: string;
    coordinates: { lat: number; lng: number };
  };
}

export default function MeetingLocationsTab({
  meetingLocations,
  userTier,
  reportId,
  homeLocation,
}: MeetingLocationsTabProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const hasAccess = userTier === 'BASIC' || userTier === 'PRO';

  // Handle regenerate (same as emergency contacts)
  const handleRegenerate = () => {
    startTransition(async () => {
      const result = await regenerateEmergencyContacts(reportId);

      if (result.success) {
        toast.success('Successfully regenerated meeting locations');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to regenerate meeting locations');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Meeting Locations
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-recommended safe meeting places for your family during emergencies
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Home: {homeLocation.city}, {homeLocation.state}
          </p>
        </div>
        <Button
          onClick={handleRegenerate}
          disabled={isPending}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
          {isPending ? 'Regenerating...' : 'Regenerate Locations'}
        </Button>
      </div>

      {/* Meeting Locations Grid */}
      {meetingLocations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {meetingLocations.map(location => (
            <MeetingLocationCard key={location.id} location={location} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No meeting locations found.</p>
            <p className="text-sm mt-2">Click "Regenerate Locations" to create them.</p>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Prompt for FREE Users */}
      {!hasAccess && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-6">
              <MapPin className="h-16 w-16 text-primary" />

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Unlock AI-Recommended Meeting Locations</h3>
                <p className="text-muted-foreground text-lg">
                  Upgrade to Basic to get personalized meeting points for your family.
                </p>
              </div>

              <div className="w-full max-w-md space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Safe Assembly Points</p>
                    <p className="text-sm text-muted-foreground">
                      AI-selected locations near your home for family reunification
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Navigation className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Practical Details</p>
                    <p className="text-sm text-muted-foreground">
                      Parking availability, accessibility, and scenario suitability
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/pricing" className="w-full max-w-xs">
                <Button size="lg" className="w-full">
                  Upgrade to Basic - $9.99/month
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Meeting location card component
 */
function MeetingLocationCard({ location }: { location: MeetingLocationRecommendation }) {
  const priorityColor = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    tertiary: 'bg-muted text-muted-foreground',
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{location.name}</CardTitle>
            <CardDescription className="mt-1">
              <Badge className={cn('capitalize', priorityColor[location.priority])}>
                {location.priority}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <span>{location.address}</span>
        </div>

        {/* Reasoning */}
        <p className="text-sm text-muted-foreground">
          {location.reasoning}
        </p>

        {/* Practical Details */}
        <div className="flex flex-wrap gap-2">
          {location.hasParking && (
            <Badge variant="outline" className="text-xs">
              🅿️ Parking
            </Badge>
          )}
          {location.isAccessible && (
            <Badge variant="outline" className="text-xs">
              ♿ Accessible
            </Badge>
          )}
          {location.isPublic && (
            <Badge variant="outline" className="text-xs">
              Public
            </Badge>
          )}
        </div>

        {/* Scenario Suitability */}
        {location.scenarioSuitability.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {location.scenarioSuitability.map(scenario => (
              <Badge key={scenario} variant="secondary" className="text-xs">
                {scenario.replace('-', ' ')}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <Link href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="w-full">
            <Navigation className="h-4 w-4 mr-2" />
            View on Google Maps
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
