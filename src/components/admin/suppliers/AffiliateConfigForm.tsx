'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { validateAffiliateTemplate } from '@/app/(protected)/admin/products/actions/affiliate-link-actions';

/**
 * AffiliateConfigForm Component
 *
 * Form fields for configuring supplier affiliate program settings.
 * Provides real-time template validation and helpful field reference.
 *
 * @example
 * <AffiliateConfigForm
 *   affiliateId={supplier.affiliateId}
 *   affiliateUrlTemplate={supplier.affiliateUrlTemplate}
 *   onChange={(config) => setSupplierData({ ...supplierData, ...config })}
 * />
 */

export interface AffiliateConfig {
  affiliateId: string;
  affiliateUrlTemplate: string;
}

export interface AffiliateConfigFormProps {
  affiliateId?: string | null;
  affiliateUrlTemplate?: string | null;
  onChange: (config: AffiliateConfig) => void;
}

const ALLOWED_FIELDS = [
  { name: 'sku', description: 'Product SKU/identifier' },
  { name: 'asin', description: 'Amazon ASIN (Amazon only)' },
  { name: 'name', description: 'Product name' },
  { name: 'price', description: 'Product price' },
  { name: 'product_url', description: 'Product URL' },
  { name: 'affiliate_id', description: 'Your affiliate ID from this form' },
];

const EXAMPLE_TEMPLATES = [
  {
    vendor: 'Amazon',
    template: 'https://www.amazon.com/dp/{asin}?tag={affiliate_id}&linkCode=ll1',
  },
  {
    vendor: 'eBay',
    template: 'https://rover.ebay.com/rover/1/{affiliate_id}/0?mpre=https://www.ebay.com/itm/{sku}',
  },
  {
    vendor: 'ShareASale',
    template: 'https://shareasale.com/r.cfm?b={sku}&u={affiliate_id}&m=MERCHANT_ID',
  },
];

export function AffiliateConfigForm({
  affiliateId: initialAffiliateId,
  affiliateUrlTemplate: initialTemplate,
  onChange,
}: AffiliateConfigFormProps): React.JSX.Element {
  const [affiliateId, setAffiliateId] = useState(initialAffiliateId || '');
  const [template, setTemplate] = useState(initialTemplate || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Validate template on change with debouncing
  useEffect(() => {
    if (!template) {
      setValidationErrors([]);
      setIsValid(false);
      return;
    }

    const validateTemplate = async (): Promise<void> => {
      setIsValidating(true);
      try {
        const result = await validateAffiliateTemplate(template);
        if (result.valid) {
          setValidationErrors([]);
          setIsValid(true);
        } else {
          setValidationErrors(result.errors || []);
          setIsValid(false);
        }
      } catch {
        setValidationErrors(['Failed to validate template']);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    // Debounce validation
    const timeoutId = setTimeout(() => {
      void validateTemplate();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [template]);

  // Notify parent of changes
  useEffect(() => {
    onChange({
      affiliateId,
      affiliateUrlTemplate: template,
    });
  }, [affiliateId, template, onChange]);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Affiliate Program Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure affiliate program settings for this supplier. Leave blank if the supplier
          doesn't participate in affiliate programs.
        </p>
      </div>

      {/* Affiliate ID Field */}
      <div className="space-y-2">
        <Label htmlFor="affiliate-id">Affiliate ID</Label>
        <Input
          id="affiliate-id"
          placeholder="your-affiliate-tag-20"
          value={affiliateId}
          onChange={(e) => setAffiliateId(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Your affiliate partner ID or tag provided by the affiliate program.
        </p>
      </div>

      {/* Affiliate URL Template Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="affiliate-template">Affiliate URL Template</Label>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {showHelp ? 'Hide' : 'Show'} Help
          </button>
        </div>
        <Textarea
          id="affiliate-template"
          placeholder="https://www.example.com/product/{sku}?ref={affiliate_id}"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={3}
          className={`font-mono text-sm ${
            template && !isValidating
              ? isValid
                ? 'border-success'
                : 'border-destructive'
              : ''
          }`}
        />

        {/* Validation Status */}
        {template && !isValidating && (
          <div className="flex items-start gap-2">
            {isValid ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <p className="text-xs text-success">Template is valid</p>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-destructive font-medium">Template errors:</p>
                  <ul className="text-xs text-destructive/80 mt-1 space-y-0.5">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {isValidating && (
          <p className="text-xs text-muted-foreground">Validating template...</p>
        )}
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-4">
          {/* Allowed Fields */}
          <div>
            <h4 className="text-sm font-medium mb-2">Allowed Template Fields:</h4>
            <div className="space-y-1">
              {ALLOWED_FIELDS.map((field) => (
                <div key={field.name} className="flex items-start gap-2 text-xs">
                  <code className="px-1.5 py-0.5 rounded bg-background font-mono">
                    {`{${field.name}}`}
                  </code>
                  <span className="text-muted-foreground">{field.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Template Examples */}
          <div>
            <h4 className="text-sm font-medium mb-2">Example Templates:</h4>
            <div className="space-y-3">
              {EXAMPLE_TEMPLATES.map((example) => (
                <div key={example.vendor} className="space-y-1">
                  <p className="text-xs font-medium">{example.vendor}:</p>
                  <button
                    type="button"
                    onClick={() => setTemplate(example.template)}
                    className="w-full text-left"
                  >
                    <code className="block px-2 py-1.5 rounded bg-background text-[11px] font-mono hover:bg-background/80 transition-colors break-all">
                      {example.template}
                    </code>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Notes */}
          <div>
            <h4 className="text-sm font-medium mb-2">Notes:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Use <code className="px-1 py-0.5 rounded bg-background font-mono text-[10px]">{'{field_name}'}</code> syntax for placeholders</li>
              <li>• Field names are case-insensitive</li>
              <li>• Both Affiliate ID and URL Template must be set for affiliate links to work</li>
              <li>• Internal IDs (id, supplierId, etc.) are blocked for security</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
