import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Users, DollarSign } from 'lucide-react';
import type { BundleCandidate } from '@/lib/bundles';

interface BundleCardProps {
  bundle: BundleCandidate;
}

export function BundleCard({ bundle }: BundleCardProps): React.JSX.Element {
  const formattedPrice = bundle.totalEstimatedPrice
    ? parseFloat(bundle.totalEstimatedPrice).toFixed(2)
    : 'N/A';

  const scenarioLabels: Record<string, string> = {
    EARTHQUAKE: 'Earthquake',
    HURRICANE: 'Hurricane',
    WILDFIRE: 'Wildfire',
    FLOOD: 'Flood',
    WINTER_STORM: 'Winter Storm',
    TORNADO: 'Tornado',
    POWER_OUTAGE: 'Power Outage',
    PANDEMIC: 'Pandemic',
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl line-clamp-2">{bundle.name}</CardTitle>
            {bundle.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {bundle.description}
              </CardDescription>
            )}
          </div>
          <Package className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Scenarios */}
        {bundle.scenarios.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Scenarios:</p>
            <div className="flex flex-wrap gap-2">
              {bundle.scenarios.map((scenario) => (
                <Badge key={scenario} variant="secondary" className="text-xs">
                  {scenarioLabels[scenario] || scenario}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Family Size */}
        {(bundle.minPeople !== null || bundle.maxPeople !== null) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {bundle.minPeople && bundle.maxPeople
                ? `${bundle.minPeople}-${bundle.maxPeople} people`
                : bundle.minPeople
                ? `${bundle.minPeople}+ people`
                : bundle.maxPeople
                ? `Up to ${bundle.maxPeople} people`
                : 'Any size'}
            </span>
          </div>
        )}

        {/* Item Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{bundle.itemCount} items included</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <span className="text-xl font-bold">${formattedPrice}</span>
        </div>
        <Button asChild>
          <Link href={`/bundles/${bundle.slug}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
