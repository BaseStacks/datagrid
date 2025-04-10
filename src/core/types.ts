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
  readonly focus: boolean;
  readonly disabled: boolean;
}

export interface DataGridColumn<TValue = any, C = any, PasteValue = any> {
  readonly id?: string
  readonly title?: React.ReactNode
  /** @deprecated Use `basis`, `grow`, and `shrink` instead */
  readonly width?: string | number
  readonly basis?: number
  readonly grow?: number
  readonly shrink?: number
  readonly minWidth?: number
  readonly maxWidth?: number
  readonly component?: React.ComponentType<CellProps<TValue>>
  readonly columnData?: C
  readonly disableKeys?: boolean
  readonly disabled?: boolean | ((opt: { rowData: TValue; rowIndex: number }) => boolean)
  readonly keepFocus?: boolean
  readonly deleteValue?: (opt: { rowData: TValue; rowIndex: number }) => TValue
  readonly copyValue?: (opt: { rowData: TValue; rowIndex: number }) => number | string | null
  readonly pasteValue?: (opt: { rowData: TValue; value: PasteValue; rowIndex: number }) => TValue
  readonly prePasteValues?: (values: string[]) => PasteValue[] | Promise<PasteValue[]>
  readonly isCellEmpty?: (opt: { rowData: TValue; rowIndex: number }) => boolean
}

export type SimpleColumn<T = any, C = any> = Partial<
  Pick<DataGridColumn<T, C, string>,
    | 'title'
    | 'maxWidth'
    | 'minWidth'
    | 'basis'
    | 'grow'
    | 'shrink'
    | 'component'
    | 'columnData'>
>

export interface Operation {
  readonly type: 'UPDATE' | 'DELETE' | 'CREATE'
  readonly fromRowIndex: number
  readonly toRowIndex: number
}

export interface DataGridProps<TRow extends RowData = RowData> {
  readonly data: TRow[]
  readonly columns: DataGridColumn[]

  readonly onChange?: (value: TRow[], operations: Operation[]) => void
  readonly gutterColumn?: SimpleColumn<TRow, any> | false
  readonly stickyRightColumn?: SimpleColumn<TRow, any>
  readonly rowKey?: RowKey<TRow>;
  readonly maxHeight?: number
  readonly rowHeight?: number | ((opt: { rowData: TRow; rowIndex: number }) => number)
  readonly headerRowHeight?: number
  readonly createRow?: () => TRow
  readonly duplicateRow?: (opts: { rowData: TRow; rowIndex: number }) => TRow
  readonly autoAddRow?: boolean
  readonly lockRows?: boolean
  readonly disableContextMenu?: boolean
  readonly disableExpandSelection?: boolean
  readonly disableSmartDelete?: boolean
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
