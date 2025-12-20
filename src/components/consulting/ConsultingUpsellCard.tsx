'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ConsultingService } from '@/db/schema/consulting';

/**
 * Placement contexts for the consulting upsell card
 * Each placement has specific messaging optimized for that user journey stage
 */
type UpsellPlacement = 'post-plan' | 'bundles-tab' | 'post-purchase' | 'header';

interface PlacementConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  ctaText: string;
  variant: 'default' | 'compact' | 'minimal';
}

const placementConfigs: Record<UpsellPlacement, PlacementConfig> = {
  'post-plan': {
    title: 'Get Expert Guidance',
    description:
      'Maximize your emergency preparedness with personalized consulting. Get expert advice on your plan, supplies, and next steps.',
    icon: <Sparkles className="h-5 w-5" />,
    ctaText: 'Schedule Consultation',
    variant: 'default',
  },
  'bundles-tab': {
    title: 'Need Help Choosing?',
    description:
      'Talk to an expert about which emergency supplies are right for your situation. Get personalized recommendations.',
    icon: <MessageSquare className="h-5 w-5" />,
    ctaText: 'Talk to an Expert',
    variant: 'default',
  },
  'post-purchase': {
    title: 'Optimize Your New Equipment',
    description:
      'Get expert help setting up, organizing, and maximizing the value of your emergency supplies.',
    icon: <Sparkles className="h-5 w-5" />,
    ctaText: 'Book Expert Review',
    variant: 'default',
  },
  header: {
    title: 'Expert Guidance',
    description: 'Get personalized emergency preparedness advice',
    icon: <MessageSquare className="h-4 w-4" />,
    ctaText: 'Talk to Expert',
    variant: 'compact',
  },
};

interface ConsultingUpsellCardProps {
  /** Placement context determines messaging and styling */
  placement: UpsellPlacement;
  /** Optional specific consulting service to promote */
  service?: ConsultingService;
  /** Optional callback instead of default navigation */
  onCTAClick?: () => void;
  /** Optional additional CSS classes */
  className?: string;
}

export function ConsultingUpsellCard({
  placement,
  service,
  onCTAClick,
  className,
}: ConsultingUpsellCardProps): React.JSX.Element {
  const router = useRouter();
  const config = placementConfigs[placement];

  const handleClick = (): void => {
    if (onCTAClick) {
      onCTAClick();
    } else if (service) {
      router.push(`/consulting/booking/${service.id}`);
    } else {
      router.push('/consulting');
    }
  };

  // Compact variant for header/sidebar placement
  if (config.variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer ${className || ''}`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{config.title}</p>
          <p className="text-xs text-muted-foreground truncate">{config.description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
      </div>
    );
  }

  // Default card variant for main content areas
  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 ${className || ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-xl">{service?.name || config.title}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                Limited Availability
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="text-base mt-3">
          {service?.description || config.description}
        </CardDescription>
      </CardHeader>

      {service && service.targetScenarios && service.targetScenarios.length > 0 && (
        <CardContent>
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
        </CardContent>
      )}

      <CardFooter>
        <Button onClick={handleClick} className="w-full group" size="lg">
          {config.ctaText}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
