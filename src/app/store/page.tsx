import { Metadata } from 'next';
import Store from '@/components/Store';

export const metadata: Metadata = {
  title: 'Emergency Supplies Store - Curated Survival Kits & Gear',
  description:
    'Shop expert-curated emergency preparedness kits and survival supplies. From 72-hour kits to complete disaster preparedness bundles. Field-tested gear for families. Free shipping on orders over $50.',
  keywords: [
    'emergency supplies store',
    'survival kits',
    '72 hour emergency kit',
    'bug out bag',
    'disaster preparedness kit',
    'emergency food storage',
    'survival gear',
    'emergency supplies',
    'disaster kit',
    'emergency preparedness supplies',
    'survival equipment',
  ],
  alternates: {
    canonical: '/store',
  },
  openGraph: {
    title: 'Emergency Supplies Store - Expert-Curated Survival Gear',
    description: 'Shop field-tested emergency kits and survival supplies. Expert-curated disaster preparedness bundles for every budget and scenario.',
    type: 'website',
    url: '/store',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emergency Supplies Store - Curated Survival Kits',
    description: 'Field-tested emergency preparedness kits and survival gear. Expert-curated bundles for every family.',
  },
};

export default function StorePage() {
    return <Store />;
}
