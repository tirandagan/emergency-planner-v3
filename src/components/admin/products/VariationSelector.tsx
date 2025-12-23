'use client';

import React, { useState, useEffect } from 'react';
import type { Product, ProductVariations } from '@/lib/products-types';

interface VariationAttribute {
  id: string;
  name: string;
  options: string[];
}
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * VariationSelector Component
 *
 * Allows users to select a specific product variation combination.
 * Displays all variation attributes from config.attributes and builds
 * the combination key for variation lookup.
 *
 * @example
 * <VariationSelector
 *   product={product}
 *   onSelectionChange={(combination) => setSelectedVariation(combination)}
 *   requiredFields={['sku', 'price']}
 * />
 */

export interface VariationSelectorProps {
  product: Product;
  onSelectionChange: (combination: string | null) => void;
  requiredFields?: string[];
}

interface VariationAttributeSelection {
  attributeId: string;
  selectedOption: string | null;
}

export function VariationSelector({
  product,
  onSelectionChange,
  requiredFields = [],
}: VariationSelectorProps): React.JSX.Element {
  const [selections, setSelections] = useState<VariationAttributeSelection[]>([]);
  const [combinationKey, setCombinationKey] = useState<string | null>(null);

  // Initialize selections from product variations
  useEffect(() => {
    if (!product.variations) return;

    const variations = product.variations as ProductVariations;
    const attributes = variations.config?.attributes || [];

    // Initialize selections with empty values
    const initialSelections = attributes.map((attr: VariationAttribute) => ({
      attributeId: attr.id,
      selectedOption: null,
    }));

    setSelections(initialSelections);
  }, [product.variations]);

  // Update combination key when selections change
  useEffect(() => {
    if (!product.variations) return;

    const variations = product.variations as ProductVariations;
    const attributes = variations.config?.attributes || [];

    // Check if all attributes have selections
    const allSelected = selections.every(sel => sel.selectedOption !== null);

    if (!allSelected) {
      setCombinationKey(null);
      onSelectionChange(null);
      return;
    }

    // Build combination key in same order as attributes
    const options = attributes.map((attr: VariationAttribute) => {
      const selection = selections.find(sel => sel.attributeId === attr.id);
      return selection?.selectedOption || '';
    });

    // Create JSON key format: ["Blue"] or ["Large","Red"]
    const key = JSON.stringify(options);
    setCombinationKey(key);
    onSelectionChange(key);
  }, [selections, product.variations, onSelectionChange]);

  if (!product.variations) {
    return (
      <div className="text-sm text-muted-foreground">
        This product has no variations.
      </div>
    );
  }

  const variations = product.variations as ProductVariations;
  const attributes = variations.config?.attributes || [];

  if (attributes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No variation attributes configured.
      </div>
    );
  }

  // Get variation data for selected combination
  const getVariationData = (): Record<string, unknown> | null => {
    if (!combinationKey) return null;
    return variations.values?.[combinationKey] || null;
  };

  const variationData = getVariationData();

  // Check for missing required fields
  const getMissingFields = (): string[] => {
    if (!variationData) return requiredFields;

    return requiredFields.filter(field => {
      const value = variationData[field];
      return value === undefined || value === null;
    });
  };

  const missingFields = getMissingFields();

  const handleSelectionChange = (attributeId: string, option: string): void => {
    setSelections(prev =>
      prev.map(sel =>
        sel.attributeId === attributeId
          ? { ...sel, selectedOption: option }
          : sel
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Variation Attributes */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Select Variation:</div>
        {attributes.map((attr: VariationAttribute) => {
          const selection = selections.find(sel => sel.attributeId === attr.id);

          return (
            <div key={attr.id} className="space-y-2">
              <Label htmlFor={`variation-${attr.id}`}>{attr.name}</Label>
              <Select
                value={selection?.selectedOption || undefined}
                onValueChange={(value) => handleSelectionChange(attr.id, value)}
              >
                <SelectTrigger id={`variation-${attr.id}`}>
                  <SelectValue placeholder={`Select ${attr.name}`} />
                </SelectTrigger>
                <SelectContent>
                  {attr.options.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {/* Selected Variation Data */}
      {combinationKey && variationData && (
        <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
          <div className="text-sm font-medium">Variation Details:</div>
          <div className="space-y-1 text-sm">
            {Object.entries(variationData).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground capitalize">{key}:</span>
                <span className="font-mono">
                  {value !== undefined && value !== null ? String(value) : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Fields Warning */}
      {combinationKey && missingFields.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <div className="text-sm font-medium text-destructive">
            Missing Required Fields:
          </div>
          <div className="mt-1 text-sm text-destructive/80">
            The following fields are missing for this variation:{' '}
            <span className="font-mono">{missingFields.join(', ')}</span>
          </div>
        </div>
      )}

      {/* No Selection Warning */}
      {selections.some(sel => sel.selectedOption === null) && (
        <div className="text-sm text-muted-foreground">
          Please select all variation attributes to continue.
        </div>
      )}
    </div>
  );
}
