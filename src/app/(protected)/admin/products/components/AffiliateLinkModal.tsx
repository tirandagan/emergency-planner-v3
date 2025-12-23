'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateAffiliateUrl } from '../actions/affiliate-link-actions';
import { toast } from 'sonner';
import type { Product } from '@/lib/products-types';
import { VariationSelector } from '@/components/admin/products/VariationSelector';
import { parseTemplateFields, getVariationFields } from '@/lib/affiliate-urls';

/**
 * AffiliateLinkModal Component
 *
 * Modal that displays vendor-agnostic affiliate link with copy and open functionality.
 * Auto-detects if template requires variation fields and shows variation selector.
 *
 * @example
 * <AffiliateLinkModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   product={product}
 *   onError={(errorType) => setErrorType(errorType)}
 * />
 */

export interface AffiliateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onError: (
    errorType: 'no_associate_id' | 'no_asin' | 'invalid_template' | 'no_affiliate_config' | 'missing_field',
    missingField?: string,
    variationCombination?: string
  ) => void;
}

export function AffiliateLinkModal({
  isOpen,
  onClose,
  product,
  onError
}: AffiliateLinkModalProps): React.JSX.Element {
  const [affiliateUrl, setAffiliateUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [needsVariationSelection, setNeedsVariationSelection] = useState(false);
  const [templateFields, setTemplateFields] = useState<string[]>([]);

  // Check if template requires variation selection
  useEffect(() => {
    if (!isOpen || !product.supplier?.affiliateUrlTemplate) {
      setNeedsVariationSelection(false);
      setTemplateFields([]);
      return;
    }

    // Parse template to find required fields
    const fields = parseTemplateFields(product.supplier.affiliateUrlTemplate);
    setTemplateFields(fields);

    // Get variation fields that exist in product
    const variationFields = getVariationFields(product);

    // Check if any template fields exist in variation data
    const requiresVariation = fields.some(field =>
      variationFields.includes(field)
    );

    setNeedsVariationSelection(requiresVariation);
  }, [isOpen, product]);

  // Generate affiliate URL when modal opens or variation selection changes
  useEffect(() => {
    if (!isOpen) {
      setAffiliateUrl(null);
      setCopied(false);
      setSelectedVariation(null);
      return;
    }

    // Don't generate if we need variation selection but haven't selected one yet
    if (needsVariationSelection && !selectedVariation) {
      setAffiliateUrl(null);
      return;
    }

    const generateUrl = async (): Promise<void> => {
      // Validate supplier and product IDs
      if (!product.supplierId || !product.id) {
        onError('no_affiliate_config');
        onClose();
        return;
      }

      setIsLoading(true);
      try {
        const result = await generateAffiliateUrl(
          product.id,
          product.supplierId,
          selectedVariation || undefined
        );

        if (result.success) {
          setAffiliateUrl(result.url);
        } else {
          onError(
            result.errorType,
            result.missingField,
            result.variationCombination
          );
          onClose();
        }
      } catch {
        // Unexpected error - default to invalid template
        onError('invalid_template');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    void generateUrl();
  }, [isOpen, product.id, product.supplierId, selectedVariation, needsVariationSelection, onClose, onError]);

  const handleCopyLink = async (): Promise<void> => {
    if (!affiliateUrl) return;

    try {
      await navigator.clipboard.writeText(affiliateUrl);
      setCopied(true);
      toast.success('Affiliate link copied to clipboard');

      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleOpenLink = (): void => {
    if (!affiliateUrl) return;
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {product.supplier?.name || 'Vendor'} Affiliate Link
          </DialogTitle>
          <DialogDescription>
            Generate affiliate link for {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Info */}
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Product:</span>{' '}
              <span className="text-foreground">{product.name}</span>
            </div>
            {product.sku && (
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">SKU:</span>{' '}
                <span className="font-mono text-foreground">{product.sku}</span>
              </div>
            )}
            {product.supplier?.name && (
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">Supplier:</span>{' '}
                <span className="text-foreground">{product.supplier.name}</span>
              </div>
            )}
          </div>

          {/* Variation Selector (if needed) */}
          {needsVariationSelection && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <VariationSelector
                product={product}
                onSelectionChange={setSelectedVariation}
                requiredFields={templateFields}
              />
            </div>
          )}

          {/* Affiliate URL */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Generating affiliate link...</div>
            </div>
          ) : affiliateUrl ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">Affiliate URL:</div>
              <div
                onClick={handleCopyLink}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    void handleCopyLink();
                  }
                }}
                className="relative cursor-pointer rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted transition-colors"
                role="button"
                tabIndex={0}
                aria-label="Click to copy affiliate link"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 break-all text-sm font-mono text-foreground/80">
                    {affiliateUrl}
                  </div>
                  <div className="shrink-0">
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : needsVariationSelection && !selectedVariation ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground text-center">
                Select a variation above to generate the affiliate link
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="default"
              className="flex-1"
              onClick={handleOpenLink}
              disabled={!affiliateUrl || isLoading}
            >
              <ExternalLink className="h-4 w-4" />
              Open Link
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>

          {/* Helper Text */}
          {product.supplier?.name && (
            <div className="text-xs text-muted-foreground pt-2">
              <p>
                Click the URL field to copy the affiliate link to your clipboard.
                Use this link to earn commissions from {product.supplier.name}.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
