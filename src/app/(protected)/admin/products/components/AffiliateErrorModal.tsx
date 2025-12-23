'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * AffiliateErrorModal Component
 *
 * Reusable error modal for affiliate link issues with contextual error messages
 * and actionable next steps.
 *
 * @example
 * <AffiliateErrorModal
 *   isOpen={!!errorType}
 *   onClose={() => setErrorType(null)}
 *   errorType="no_associate_id"
 *   productName={product.name}
 * />
 */

export type AffiliateErrorType =
  | 'no_associate_id'
  | 'no_asin'
  | 'invalid_template'
  | 'no_affiliate_config'
  | 'missing_field';

export interface AffiliateErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: AffiliateErrorType;
  productName: string;
  missingField?: string;
  variationCombination?: string;
}

interface ErrorConfig {
  title: string;
  description: string;
  showSettingsLink: boolean;
}

const ERROR_CONFIGS: Record<AffiliateErrorType, ErrorConfig> = {
  no_associate_id: {
    title: 'Amazon Associate ID Not Configured',
    description: 'The Amazon Associate ID system setting has not been configured. Please add your Amazon Associate ID in the system settings to generate affiliate links.',
    showSettingsLink: true,
  },
  no_asin: {
    title: 'Missing Product ASIN',
    description: 'This product does not have a valid Amazon ASIN. Please edit the product and add an ASIN to generate affiliate links.',
    showSettingsLink: false,
  },
  invalid_template: {
    title: 'Invalid Affiliate URL Template',
    description: 'The affiliate URL template is missing or invalid. Please check the supplier\'s affiliate configuration and ensure it includes valid field placeholders.',
    showSettingsLink: false,
  },
  no_affiliate_config: {
    title: 'Affiliate Program Not Configured',
    description: 'This supplier does not have affiliate program configuration. Please edit the supplier and add an affiliate ID and URL template to generate affiliate links.',
    showSettingsLink: false,
  },
  missing_field: {
    title: 'Missing Required Field',
    description: 'A required field for the affiliate link template is missing from the product data.',
    showSettingsLink: false,
  },
};

export function AffiliateErrorModal({
  isOpen,
  onClose,
  errorType,
  productName,
  missingField,
  variationCombination,
}: AffiliateErrorModalProps): React.JSX.Element {
  const config = ERROR_CONFIGS[errorType];

  // Dynamic description for missing_field error
  const getDescription = (): string => {
    if (errorType === 'missing_field' && missingField) {
      if (variationCombination) {
        return `The {${missingField}} is missing for variation '${variationCombination}' for this product.`;
      }
      return `The {${missingField}} field is not available for this product.`;
    }
    return config.description;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Unable to generate affiliate link for <span className="font-medium text-foreground">{productName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Message */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-foreground/80">
              {getDescription()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {config.showSettingsLink && (
              <Link href="/admin/debug?tab=settings" className="flex-1">
                <Button variant="default" className="w-full">
                  <Settings className="h-4 w-4" />
                  Go to System Settings
                </Button>
              </Link>
            )}
            <Button
              variant={config.showSettingsLink ? 'outline' : 'default'}
              onClick={onClose}
              className={config.showSettingsLink ? '' : 'flex-1'}
            >
              Close
            </Button>
          </div>

          {/* Helper Text */}
          {errorType === 'no_associate_id' && (
            <div className="text-xs text-muted-foreground pt-2">
              <p>
                Need an Amazon Associate ID?{' '}
                <a
                  href="https://affiliate-program.amazon.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Sign up for Amazon Associates
                </a>
              </p>
            </div>
          )}

          {errorType === 'invalid_template' && (
            <div className="text-xs text-muted-foreground pt-2">
              <p>
                Default template: <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  https://www.amazon.com/dp/{'{ASIN}'}?&linkCode=ll1&tag={'{amazon_associate_id}'}&ref_=as_li_ss_tl
                </code>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
