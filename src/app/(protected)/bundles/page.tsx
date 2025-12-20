import React, { Suspense } from 'react';
import { Package } from 'lucide-react';
import { getAllBundles } from '@/lib/bundles';
import { BundleCard } from '@/components/bundles/BundleCard';
import { ConsultingUpsellCard } from '@/components/consulting/ConsultingUpsellCard';
import { getActiveConsultingServices } from '@/lib/consulting';

async function BundlesContent(): Promise<React.JSX.Element> {
  const bundles = await getAllBundles(50);
  const consultingServices = await getActiveConsultingServices({ isGeneric: true });
  const genericConsulting = consultingServices[0]; // Get first generic consulting service

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Emergency Supply Bundles</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Curated emergency supply packages matched to specific scenarios and family sizes.
          Each bundle contains pre-vetted gear to help you prepare for disasters.
        </p>
      </div>

      {/* Consulting Upsell */}
      {genericConsulting && (
        <ConsultingUpsellCard
          service={genericConsulting}
          placement="bundles-tab"
        />
      )}

      {/* Bundles Grid */}
      {bundles.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Bundles Available</h2>
          <p className="text-muted-foreground">
            Check back soon! We're working on adding emergency supply bundles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
      )}
    </div>
  );
}

function BundlesLoading(): React.JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary animate-pulse" />
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-6 w-full max-w-2xl bg-muted animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function BundlesPage(): React.JSX.Element {
  return (
    <Suspense fallback={<BundlesLoading />}>
      <BundlesContent />
    </Suspense>
  );
}
