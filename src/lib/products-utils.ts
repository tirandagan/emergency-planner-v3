/**
 * Utility functions for the Admin Products page
 *
 * This file contains helper functions for formatting, display,
 * and data manipulation in the product catalog.
 */

import type { FormattedTagValue, IconType } from './products-types';

/**
 * Formats tag values for condensed display
 *
 * Converts verbose labels to short codes or icons:
 * - Timeframes: "1 year" → "1Y", "1 month" → "1MO"
 * - Demographics: "Man" → mars icon, "Woman" → venus icon
 * - Scenarios: "EMP" → zap icon, "CBRN" → radiation icon
 *
 * @param value - The tag value to format
 * @param field - Optional field type (for context-specific formatting)
 * @returns Formatted string or icon object
 */
export function formatTagValue(value: string, field?: string): FormattedTagValue {
  const lower = value.toLowerCase();

  // Scenarios - use icons everywhere
  if (lower === 'emp') return { icon: 'zap' };
  if (lower === 'cbrn') return { icon: 'radiation' };
  if (lower === 'domestic terrorism') return { icon: 'alertTriangle' };
  if (lower === 'civil unrest') return { icon: 'users' };
  if (lower === 'storms') return { icon: 'cloud' };

  // Timeframes - use short codes
  if (lower === '3 days') return '3D';
  if (lower === '1 week') return '1W';
  if (lower === '1 month') return '1MO';
  if (lower === '3 months') return '3MO';
  if (lower === '1 year') return '1Y';

  // Demographics - use icons for all
  if (lower === 'man') return { icon: 'mars' };
  if (lower === 'woman') return { icon: 'venus' };
  if (lower === 'adult') return { icon: 'userCheck' };
  if (lower === 'child') return { icon: 'baby' };

  return value;
}

/**
 * Gets display name for icon values
 *
 * Converts icon identifiers back to human-readable names
 * for tooltips and accessibility.
 *
 * @param icon - Icon identifier
 * @param originalValue - Optional original value to use instead
 * @returns Display-friendly name
 */
export function getIconDisplayName(icon: string, originalValue?: string): string {
  if (originalValue) return originalValue;

  const iconMap: Record<string, string> = {
    'mars': 'Male',
    'venus': 'Female',
    'userCheck': 'Adult',
    'baby': 'Child',
    'zap': 'EMP',
    'radiation': 'CBRN',
    'alertTriangle': 'Domestic Terrorism',
    'cloud': 'Storms',
  };

  return iconMap[icon] || icon;
}

/**
 * Sort timeframes in logical chronological order
 *
 * Orders timeframes from shortest to longest duration:
 * 3 Days → 1 Week → 1 Month → 3 Months → 1 Year
 *
 * Deduplicates timeframes before sorting to prevent duplicate tags.
 *
 * @param timeframes - Array of timeframe strings
 * @returns Deduplicated and sorted array in chronological order
 */
export function sortTimeframes(timeframes: string[]): string[] {
  const order: Record<string, number> = {
    '3 days': 1,
    '1 week': 2,
    '1 month': 3,
    '3 months': 4,
    '1 year': 5,
  };

  // Deduplicate using Set (case-insensitive comparison)
  const uniqueTimeframes = Array.from(
    new Map(
      timeframes.map(tf => [tf.toLowerCase(), tf])
    ).values()
  );

  return uniqueTimeframes.sort((a, b) => {
    const orderA = order[a.toLowerCase()] || 999;
    const orderB = order[b.toLowerCase()] || 999;
    return orderA - orderB;
  });
}
