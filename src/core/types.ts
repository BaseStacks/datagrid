import React from 'react';

export type RowData = Record<string, any>;
export type RowKey<TRow extends RowData> = keyof TRow | ((opts: { rowData: TRow; rowIndex: number }) => TRow[keyof TRow])

export interface CellCoordinates {
  readonly col: number
  readonly row: number
}

export interface ScrollBehavior {
  readonly doNotScrollX?: boolean
  readonly doNotScrollY?: boolean
}

export interface RangeSelection {
  readonly min: CellCoordinates;
  readonly max: CellCoordinates
}

export interface RowSize {
  readonly height: number;
  readonly top: number
}

export interface CellProps<TValue> {
  readonly value?: TValue;
  readonly active: boolean;
  readonly focused: boolean;
  readonly disabled: boolean;
  readonly setValue: (value: TValue) => void;
}

export interface ColumnDefinition<TValue = any> {
  readonly dataKey?: string;
  readonly header?: string | (() => any);
  readonly cell?: (opts: CellProps<TValue>) => React.ReactNode
  readonly footer?: string | (() => any);
}

export interface RowOperation {
  readonly type: 'UPDATE' | 'DELETE' | 'CREATE'
  readonly fromRowIndex: number
  readonly toRowIndex: number
}

export interface DataGridProps<TRow extends RowData = RowData> {
  readonly data: TRow[]
  readonly columns: ColumnDefinition[]

  readonly stickyRightColumn?: ColumnDefinition;
  readonly rowKey?: RowKey<TRow>;
  readonly maxHeight?: number;
  readonly rowHeight?: number | ((opt: { rowData: TRow; rowIndex: number }) => number);
  readonly headerRowHeight?: number;
  readonly autoAddRow?: boolean
  readonly lockRows?: boolean
  readonly disableSmartDelete?: boolean

  // Row operations
  readonly createRow?: () => TRow;
  readonly duplicateRow?: (opts: { rowData: TRow; rowIndex: number }) => TRow;

  // Callbacks
  readonly onChange?: (value: TRow[], operations: RowOperation[]) => void
  readonly onFocus?: (opts: { cell: CellWithId }) => void
  readonly onBlur?: (opts: { cell: CellWithId }) => void
  readonly onActiveCellChange?: (opts: { cell: CellWithId | null }) => void
  readonly onSelectionChange?: (opts: { selection: SelectionWithId | null }) => void
}

export interface CellWithId {
  readonly colId?: string
  readonly col: number
  readonly row: number
}

export interface SelectionWithId { readonly min: CellWithId; readonly max: CellWithId }

export interface SelectionMode {
  readonly columns: boolean;
  readonly rows: boolean;
  readonly active: boolean;
}
