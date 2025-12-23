'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/products-types';

/**
 * AffiliateLinkButton Component
 *
 * Small circular button that appears next to Amazon supplier names.
 * Opens the AffiliateLinkModal when clicked to display and test affiliate links.
 *
 * @example
 * {product.supplier?.name === 'Amazon' && (
 *   <AffiliateLinkButton product={product} />
 * )}
 */

export interface AffiliateLinkButtonProps {
  product: Product;
  onOpenModal: () => void;
}

export function AffiliateLinkButton({ onOpenModal }: AffiliateLinkButtonProps): React.JSX.Element {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 hover:bg-primary/10"
      onClick={(e) => {
        e.stopPropagation();
        onOpenModal();
      }}
      title="Affiliate Link"
      aria-label="Open affiliate link tester"
    >
      <ExternalLink className="h-3.5 w-3.5 text-primary" />
    </Button>
  );
}
