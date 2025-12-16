'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Droplets,
  Utensils,
  Flashlight,
  Radio,
  Bandage,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';

const exampleBundleItems = [
  {
    category: 'Water',
    icon: Droplets,
    items: [
      { name: '7-gallon water containers (x2)', rationale: '1 gallon/person/day for 7 days (2 people)' },
      { name: 'Sawyer water filter', rationale: 'Long-term filtration for natural water sources' },
      { name: 'Water purification tablets', rationale: 'Backup method if filter unavailable' },
    ],
  },
  {
    category: 'Food',
    icon: Utensils,
    items: [
      { name: '7-day freeze-dried food supply', rationale: '25-year shelf life, no refrigeration needed' },
      { name: 'High-calorie emergency bars', rationale: 'Compact, no preparation required' },
      { name: 'Camp stove + fuel', rationale: 'Hot meals for morale and nutrition' },
    ],
  },
  {
    category: 'Light & Power',
    icon: Flashlight,
    items: [
      { name: 'LED lantern (solar + crank)', rationale: 'Indefinite light without batteries' },
      { name: 'Tactical flashlight', rationale: 'High-output for security checks' },
      { name: 'Power bank (20,000mAh)', rationale: 'Multiple phone charges for communication' },
    ],
  },
  {
    category: 'Communication',
    icon: Radio,
    items: [
      { name: 'NOAA weather radio', rationale: 'Emergency broadcasts even without cell service' },
      { name: 'Two-way radios (pair)', rationale: 'Family communication without infrastructure' },
    ],
  },
  {
    category: 'Medical',
    icon: Bandage,
    items: [
      { name: 'Comprehensive first aid kit', rationale: 'Trauma supplies + daily medications space' },
      { name: 'Prescription medication storage', rationale: '30-day supply rotation system' },
    ],
  },
];

export function BundleExampleModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package className="w-4 h-4" strokeWidth={2} />
          See Bundle Example
          <ArrowRight className="w-4 h-4" strokeWidth={2} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-primary" strokeWidth={2} />
            Example: Essential 1-Week Bundle
          </DialogTitle>
          <DialogDescription>
            How we curate bundles to solve for the most likely problems
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Bundle Overview */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" strokeWidth={2} />
                <span className="font-semibold text-foreground">Coverage Timeline</span>
              </div>
              <Badge className="bg-emerald-500 hover:bg-emerald-500">1 Week</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              This entry-level bundle covers the most common emergency scenarios for up to 7 days.
              Designed for 2 adults, it addresses water, food, light, communication, and basic medical
              needs during infrastructure disruptions.
            </p>
          </div>

          {/* Bundle Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" strokeWidth={2} />
              What&rsquo;s Included & Why
            </h3>

            {exampleBundleItems.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.category} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-primary" strokeWidth={2} />
                    <span className="font-medium text-foreground">{category.category}</span>
                  </div>
                  <div className="space-y-2">
                    {category.items.map((item) => (
                      <div key={item.name} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                        <div>
                          <span className="text-foreground">{item.name}</span>
                          <span className="text-muted-foreground"> — {item.rationale}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Decision Rationale */}
          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="font-semibold text-foreground">Our Curation Philosophy</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Research-Driven Selection:</strong> Every item is chosen
                based on our analysis of the most critical needs during the first week of an emergency,
                when government resources are typically overwhelmed.
              </p>
              <p>
                <strong className="text-foreground">Redundancy Where It Matters:</strong> For life-critical
                needs like water purification, we include backup methods. A single point of failure
                in these areas could be dangerous.
              </p>
              <p>
                <strong className="text-foreground">No Filler Items:</strong> We don&rsquo;t pad bundles
                with cheap accessories. Every item serves a specific purpose validated by our research
                and testing.
              </p>
            </div>
          </div>

          {/* Upgrade Path */}
          <div className="bg-primary/5 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Ready for more coverage?</strong> Our higher-tier bundles
              extend protection to 1 month, 1 year, and beyond—adding long-term food storage, advanced
              power solutions, and specialized equipment for extended scenarios.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
