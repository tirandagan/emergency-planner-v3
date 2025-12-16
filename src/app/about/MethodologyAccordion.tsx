'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Package,
  Clock,
  Droplets,
  Zap,
  Users,
  CloudRain,
  Radiation,
  Wifi,
  DollarSign,
  Home,
  Utensils,
  Shield,
  Heart,
  Shirt,
  Wrench,
  Fuel,
  GraduationCap,
} from 'lucide-react';

// Icon mapping for serializable data
const iconMap: Record<string, React.ElementType> = {
  Zap,
  Users,
  CloudRain,
  Radiation,
  Wifi,
  DollarSign,
  Home,
  Droplets,
  Utensils,
  Shield,
  Heart,
  Shirt,
  Wrench,
  Fuel,
  GraduationCap,
};

interface EmergencyScenario {
  name: string;
  description: string;
  iconName: string;
  severity: string;
}

interface KeyCategory {
  name: string;
  iconName: string;
  description: string;
}

interface Timeframe {
  period: string;
  description: string;
  color: string;
}

interface MethodologyAccordionProps {
  emergencyScenarios: EmergencyScenario[];
  keyCategories: KeyCategory[];
  timeframes: Timeframe[];
}

export function MethodologyAccordion({
  emergencyScenarios,
  keyCategories,
  timeframes,
}: MethodologyAccordionProps) {
  return (
    <Accordion type="single" collapsible className="space-y-4">
      {/* WHAT Section - Emergency Scenarios */}
      <AccordionItem value="what" className="border border-border rounded-lg bg-white dark:bg-slate-950">
        <AccordionTrigger className="hover:no-underline px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertTriangle className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold text-foreground block">
                WHAT: Emergency Scenarios We Address
              </span>
              <span className="text-sm text-muted-foreground">
                6 critical scenarios from EMP to civil unrest
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <p className="text-muted-foreground mb-6">
            We took an analytical approach, starting with identifying the emergencies to solve for—knowing
            multiple factors could trigger any scenario, and several could occur simultaneously.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emergencyScenarios.map((scenario) => {
              const Icon = iconMap[scenario.iconName] || AlertTriangle;
              return (
                <Card key={scenario.name} className="border-border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-foreground text-sm">{scenario.name}</h4>
                          <Badge
                            variant={scenario.severity === 'Critical' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {scenario.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {scenario.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* KEY CATEGORIES Section */}
      <AccordionItem value="categories" className="border border-border rounded-lg bg-white dark:bg-slate-950">
        <AccordionTrigger className="hover:no-underline px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold text-foreground block">
                KEY CATEGORIES: Essential Survival Elements
              </span>
              <span className="text-sm text-muted-foreground">
                9 categories from shelter to knowledge
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <p className="text-muted-foreground mb-6">
            We identified the key categories an emergency could impact. Missing any one could create
            a cascade of additional issues, jeopardizing your safety and ultimately even survival.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {keyCategories.map((category) => {
              const Icon = iconMap[category.iconName] || Package;
              return (
                <div
                  key={category.name}
                  className="flex flex-col items-center text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="p-2 rounded-full bg-primary/10 mb-2">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{category.name}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{category.description}</span>
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* WHEN Section - Timeframe Analysis */}
      <AccordionItem value="when" className="border border-border rounded-lg bg-white dark:bg-slate-950">
        <AccordionTrigger className="hover:no-underline px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold text-foreground block">
                WHEN: Timeframe-Based Solutions
              </span>
              <span className="text-sm text-muted-foreground">
                From 1 week to 1+ year preparedness
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <p className="text-muted-foreground mb-6">
            Our next step was determining WHEN each segment would be impacted. Many scenarios have
            multiple timeframes to solve for to prevent life-threatening problems.
          </p>

          {/* Timeframe Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {timeframes.map((tf) => (
              <div key={tf.period} className="bg-slate-50 dark:bg-slate-900 border border-border rounded-lg p-3">
                <div className={`w-2.5 h-2.5 rounded-full ${tf.color} mb-2`} />
                <h4 className="font-bold text-foreground text-sm mb-1">{tf.period}</h4>
                <p className="text-xs text-muted-foreground">{tf.description}</p>
              </div>
            ))}
          </div>

          {/* Water Example Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Droplets className="w-4 h-4 text-primary" strokeWidth={2.5} />
                Real-World Example: Water Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Understanding cascade effects through timeframe analysis:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">Day 1</Badge>
                  <span className="text-sm text-foreground">
                    Water towers maintain normal supply from stored reserves (~1 day capacity)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">Day 2-3</Badge>
                  <span className="text-sm text-foreground">
                    Backup generators run out of fuel, water treatment plants stop pumping
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="destructive" className="mt-0.5 shrink-0 text-xs">Day 4+</Badge>
                  <span className="text-sm text-foreground">
                    No tap water, sanitation crisis begins—need stored water and purification methods
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                This analysis drives our bundle design: minimum 1-week water storage in basic bundles,
                with purification tools for extended scenarios.
              </p>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
