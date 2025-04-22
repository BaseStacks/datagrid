import React from 'react';

export type DataGridEventTypes = {
  readonly 'execute-action': {
    readonly action: DataGridAction;
  }
};

export type DataGridEventType = keyof DataGridEventTypes;

export type RowData = Record<string, any>;
export type RowKey<TRow extends RowData> = keyof TRow | ((opts: { rowData: TRow; rowIndex: number }) => TRow[keyof TRow])
export type Unsubscribe = () => void;

export type ColumnKey = string | number;
export type RowDataKey = string | number;

export type HeaderId = `header:${ColumnKey}`;
export type RowId = `row:${RowDataKey}`;
export type CellId = `cell:${RowDataKey}-${ColumnKey}`;

export type Id = HeaderId | RowId | CellId;

export type WithId<TId, TData> = TData & { readonly id: TId };

export interface CellCoordinates {
  readonly col: number
  readonly row: number
}

export interface ScrollBehavior {
  readonly doNotScrollX?: boolean
  readonly doNotScrollY?: boolean
}

export type SelectedRangeEdge = 'top' | 'bottom' | 'left' | 'right';

export interface SelectedCell {
  readonly edges: SelectedRangeEdge[];
}

export interface CellSelectedRange {
  readonly start: CellId;
  readonly end: CellId;
}

export interface CellSelectedRangeWithCells extends CellSelectedRange {
  readonly cells: Map<CellId, SelectedCell>;
}

export interface SelectionBoundary {
  readonly min: CellCoordinates;
  readonly max: CellCoordinates
}

export interface RowSize {
  readonly height: number;
  readonly top: number
}

export interface CellProps<TValue = any> {
  readonly id: CellId;
  readonly rowId: RowId;
  readonly colId: HeaderId;
  readonly value?: TValue;
  readonly active: boolean;
  readonly focused: boolean;
  readonly disabled: boolean;
  readonly blur: () => void;
  readonly setValue: (value: TValue) => void;
  readonly onFocus: (callback: () => void) => Unsubscribe;
  readonly onBlur: (callback: () => void) => Unsubscribe;
}

export interface Cell<TValue = any> {
  readonly id: CellId;
  readonly rowId: RowId;
  readonly colId: HeaderId;
  readonly render: () => TValue;
}

export interface ColumnHeader {
  readonly id: HeaderId;
  readonly column: Column;
  readonly render: () => string | React.ReactNode;
}

export interface Column<TValue = any> {
  readonly dataKey?: string;
  readonly header?: string | (() => any);
  readonly cell?: string | ((opts: CellProps<TValue>) => React.ReactNode)
  readonly footer?: string | (() => any);
  readonly disabled?: boolean | ((opts: { value: RowData; rowIndex: number }) => boolean);
  readonly pinned?: 'left' | 'right';
  readonly prePasteValues?: (values: string[]) => TValue[];
  readonly pasteValue?: (opts: { value: TValue; rowData: RowData; rowIndex: number }) => TValue | Promise<TValue>;
  readonly isCellEmpty?: (opts: { value: RowData; rowIndex: number }) => boolean;
  readonly deleteValue?: (opts: { value: RowData; rowIndex: number }) => TValue | Promise<TValue>;
}

export interface ColumnLayout {
  readonly index: number;
  readonly header: ColumnHeader;
  readonly width: number;
  readonly firstLeftPinned: boolean;
  readonly lastLeftPinned: boolean;
  readonly firstRightPinned: boolean;
  readonly lastRightPinned: boolean;
  readonly left?: number;
  readonly right?: number;
}

export interface Row<TRow extends RowData = RowData> {
  readonly index: number;
  readonly data: TRow;
  readonly cells: Cell[];
}

export interface RowOperation {
  readonly type: 'UPDATE' | 'DELETE' | 'CREATE'
  readonly fromRowIndex: number
  readonly toRowIndex: number
}

export interface DataGridOptions<TRow extends RowData = RowData> {
  readonly data: TRow[]
  readonly columns: Column[]

  readonly rowKey?: RowKey<TRow>;
  readonly lockRows?: boolean;

  // Layout
  readonly columnMinWidth?: number;
  readonly columnMaxWidth?: number;
  readonly headerHeight?: number;
  readonly rowHeight?: number;

  // Deleting an empty cell of an empty row will actually remove the row. 
  // This behavior is auto-disabled if the lockRows is enabled.
  readonly disableSmartDelete?: boolean;

  // Row operations
  readonly createRow?: () => TRow;
  readonly duplicateRow?: (opts: { rowData: TRow; rowIndex: number }) => TRow;

  // Callbacks
  readonly onChange?: (value: TRow[], operations: RowOperation[]) => void
}

export interface CellWithId {
  readonly colId?: string
  readonly col: number
  readonly row: number
}

export interface SelectionWithId { readonly min: CellWithId; readonly max: CellWithId }

export interface DragSelection {
  readonly active: boolean;
}

export type DataGridAction =
  | 'activeLower'
  | 'activeUpper'
  | 'activeLeft'
  | 'activeRight'

  | 'jumpBottom'
  | 'jumpTop'
  | 'jumpLeft'
  | 'jumpRight'

  | 'expandRight'
  | 'expandLeft'
  | 'expandLower'
  | 'expandUpper'

  | 'selectAll'
  | 'exit'
  | 'focus'
  ;

export type DataGridKeyMap<TAction extends DataGridAction> = Partial<Record<TAction, string | string[]>>;

export interface DataGridPluginOptions {
  readonly enable?: boolean;
}

export type DataGridPlugin<TOptions extends DataGridPluginOptions = DataGridPluginOptions> = {
  readonly active: boolean;
  readonly activate: (opts?: TOptions) => void;
  readonly deactivate: () => void;
};

export interface RectType {
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}
