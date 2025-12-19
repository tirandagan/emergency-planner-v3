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
  if (lower === '1 year') return '1Y';
  if (lower === '>1 year') return '>1Y';
  if (lower === '1 month') return '1MO';
  if (lower === '1 week') return '1W';

  // Demographics - use icons for all
  if (lower === 'man') return { icon: 'mars' };
  if (lower === 'woman') return { icon: 'venus' };
  if (lower === 'adult') return { icon: 'userCheck' };
  if (lower === 'child') return { icon: 'baby' };
  if (lower === 'individual') return { icon: 'user' };
  if (lower === 'family') return { icon: 'users' };

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
    'user': 'Individual',
    'users': 'Family',
    'zap': 'EMP',
    'radiation': 'CBRN',
    'alertTriangle': 'Domestic Terrorism',
    'cloud': 'Storms',
  };

  return iconMap[icon] || icon;
}
