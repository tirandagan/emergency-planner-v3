/**
 * BrandText Component
 *
 * Renders the "BePrepared" brand name with consistent styling:
 * - "Be" in hot red (#ef4444)
 * - "Prepared" in standard text color
 *
 * Usage:
 * <BrandText /> - Default inline rendering
 * <BrandText className="text-xl" /> - With custom classes
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface BrandTextProps {
  className?: string;
  /**
   * Include ".ai" suffix after "Prepared"
   * @default false
   */
  withDomain?: boolean;
}

export function BrandText({ className, withDomain = false }: BrandTextProps): React.ReactElement {
  return (
    <span className={cn("font-semibold", className)}>
      <span className="text-red-500">Be</span>
      <span>Prepared</span>
      {withDomain && <span>.ai</span>}
    </span>
  );
}

/**
 * BrandTextBlock Component
 *
 * Renders "BePrepared" as a block-level element with optional domain suffix
 * Useful for headers, logos, and standalone brand mentions
 */
export function BrandTextBlock({ className, withDomain = false }: BrandTextProps): React.ReactElement {
  return (
    <div className={cn("font-semibold", className)}>
      <span className="text-red-500">Be</span>
      <span>Prepared</span>
      {withDomain && <span>.ai</span>}
    </div>
  );
}
