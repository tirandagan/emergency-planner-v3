import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Props for the FilterActiveIndicator component
 */
export interface FilterActiveIndicatorProps {
  /** Number of visible categories after filtering */
  visibleCount: number;
  /** Total number of categories */
  totalCount: number;
  /** Current search term (if any) */
  searchTerm: string;
}

/**
 * FilterActiveIndicator
 *
 * Displays a banner indicating that filters are active and shows the count
 * of visible categories versus total categories. Includes the search term if present.
 *
 * @example
 * ```tsx
 * <FilterActiveIndicator
 *   visibleCount={5}
 *   totalCount={10}
 *   searchTerm="water"
 * />
 * ```
 */
/**
 * FilterActiveIndicator - Memoized for performance
 * Only re-renders when filter counts or search term change
 */
export const FilterActiveIndicator = React.memo(function FilterActiveIndicator({
  visibleCount,
  totalCount,
  searchTerm
}: FilterActiveIndicatorProps): React.JSX.Element {
  return (
    <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" strokeWidth={2.5} />
      <span className="text-blue-900 dark:text-blue-100">
        Showing <strong>{visibleCount}</strong> of <strong>{totalCount}</strong> categories
        {searchTerm && <span className="ml-1 text-blue-700 dark:text-blue-300">matching "{searchTerm}"</span>}
      </span>
    </div>
  );
});
