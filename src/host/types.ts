export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type DataGridEventTypes = {
  readonly 'action-executed': {
    readonly action: DataGridAction;
  }
};

export type MaybePromise<T> = T | Promise<T>;

export type CellSelectionDraggingStatus = 'start' | 'dragging' | false;

export type DataGridEventType = keyof DataGridEventTypes;

export type RowData = Record<string, any>;
export type RowKey = string | number;
export type Unsubscribe = () => void;

export type ColumnKey = string | number;
export type RowDataKey = string | number;

export type HeaderGroupId = `headerGroup:${string}`;
export type HeaderId = `header:${ColumnKey}`;
export type RowContainerId = `rowContainer:${string}`;
export type RowId = `row:${RowDataKey}`;
export type CellId = `cell:${RowDataKey}-${ColumnKey}`;
export type EditorContainerId = 'editorContainer';

export type Id = HeaderGroupId | HeaderId | RowContainerId | RowId | CellId | EditorContainerId;

export type WithId<TId, TData> = TData & { readonly id: TId };

export interface CellCoordinates {
  readonly columnIndex: number;
  readonly rowIndex: number;
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

export interface CellProps<TValue = any> {
  readonly id: CellId;
  readonly rowId: RowId;
  readonly headerId: HeaderId;
  readonly value?: TValue;
  readonly setValue: (value: TValue) => void;
}

export interface CellEditorProps<TValue = any> {
  readonly id: CellId;
  readonly defaultValue?: TValue;
  readonly setValue: (value: TValue) => void;
}

export interface CellRender {
  readonly id: CellId;
  readonly rowId: RowId;
  readonly headerId: HeaderId;
  readonly coordinates: CellCoordinates;
}

export interface ColumnHeader {
  readonly id: HeaderId;
  readonly index: number;
  readonly column: Column;
  readonly render: () => any;
}

export type CustomEditor<TValue> = {
  readonly float: true;
  readonly render: ((opts: CellEditorProps<TValue>) => any);
}

export interface Column<TValue = any> {
  readonly key: string;
  readonly header?: string | (() => any);
  readonly cell?: ((opts: CellProps<TValue>) => any)
  readonly footer?: string | (() => any);
  readonly editor?: ((opts: CellEditorProps<TValue>) => any) | CustomEditor<TValue>;
  readonly disabled?: boolean | ((opts: { value: RowData; rowIndex: number }) => boolean);
  readonly prePasteValues?: (values: string[]) => TValue[];
  readonly pasteValue?: (opts: { value: TValue; rowData: RowData; rowIndex: number }) => TValue | Promise<TValue>;
  readonly isCellEmpty?: (opts: { value: RowData; rowIndex: number }) => boolean;
  readonly deleteValue?: (opts: { value: RowData; rowIndex: number }) => TValue | Promise<TValue>;
}

export interface ColumnLayout {
  readonly index: number;
  readonly header: ColumnHeader;
  readonly width: number;
  readonly pinned?: 'left' | 'right';
  readonly firstLeftPinned?: boolean;
  readonly lastLeftPinned?: boolean;
  readonly firstRightPinned?: boolean;
  readonly lastRightPinned?: boolean;
  readonly left?: number;
  readonly right?: number;
}

export interface RowLayout {
  readonly index: number;
  readonly row: Row;
  readonly height: number;
  readonly top?: number;
  readonly bottom?: number;
  readonly pinned?: 'top' | 'bottom';
  readonly firstPinnedTop?: true;
  readonly lastPinnedTop?: true;
  readonly firstPinnedBottom?: true;
  readonly lastPinnedBottom?: true;
}

export interface Row<TRow extends RowData = RowData> {
  readonly id: RowId;
  readonly key: RowKey;
  readonly index: number;
  readonly data: TRow;
  readonly cells: CellRender[];
}

export interface RowOperation {
  readonly type: 'UPDATE' | 'DELETE' | 'CREATE'
  readonly fromRowIndex: number
  readonly toRowIndex: number
}

export interface DataGridOptions<TRow extends RowData = RowData> {
  readonly data: TRow[]
  readonly columns: Column[]

  readonly rowKey: RowKey;
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
  readonly headerId?: string
  readonly col: number
  readonly row: number
}

export interface SelectionWithId {
  readonly min: CellWithId;
  readonly max: CellWithId
}

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

  | 'copy'
  | 'cut'
  | 'paste'
  ;

export type DataGridKeyMap<TAction extends DataGridAction> = Partial<Record<TAction, string | string[]>>;

export interface RectType {
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly top: number;
}
