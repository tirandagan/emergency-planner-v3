/**
 * TypeScript type definitions for SmartTable component
 * Provides configuration interfaces for resizable, filterable, sortable data tables
 */

import type { ReactNode } from 'react';

/**
 * Column definition for smart table features
 */
export interface SmartColumnDef<TData> {
  id: string;
  header: string | ((props: { table: unknown }) => ReactNode);
  accessorKey?: keyof TData;
  cell?: (row: TData, width?: number) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'date' | 'number' | 'enum';
  defaultVisible?: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

/**
 * Filter operator types for different data types
 */
export type FilterOperator =
  | 'contains'
  | 'equals'
  | 'gt'
  | 'lt'
  | 'between'
  | 'before'
  | 'after'
  | 'range'
  | 'in';

/**
 * Filter state for a single column
 */
export interface ColumnFilter {
  columnId: string;
  type: 'text' | 'date' | 'number' | 'enum';
  operator: FilterOperator;
  value: string | number | Date | string[];
}

/**
 * Sorting state for a single column
 */
export interface ColumnSort {
  id: string;
  desc: boolean;
}

/**
 * Table preferences stored in local storage
 */
export interface TablePreferences {
  columnWidths: Record<string, number>;
  columnVisibility: Record<string, boolean>;
  columnOrder: string[];
  sorting: ColumnSort[];
  filters: ColumnFilter[];
  version: string;
}

/**
 * Default table preferences
 */
export const DEFAULT_PREFERENCES: TablePreferences = {
  columnWidths: {},
  columnVisibility: {},
  columnOrder: [],
  sorting: [],
  filters: [],
  version: '1.0.0',
};
