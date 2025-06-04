import type { CellCoordinates, ColumnHeader, CellSelectedRangeWithCells, Row, RowData, WithId, CellId, DataGridOptions, ColumnFooter } from '../types';
import { DataGridState } from '../atomic/DataGridState';

export type DataGridEditingValue = false | 'inline' | 'floating';

export class DataGridStates<TRow extends RowData> {
    constructor(public options: DataGridOptions<TRow>) {
    }
    public editing = new DataGridState<DataGridEditingValue>(false);
    public activeCell = new DataGridState<WithId<CellId, CellCoordinates> | null>(null);
    public lastEditingCell = new DataGridState<WithId<CellId, CellCoordinates> | null>(null);
    public selectedRanges = new DataGridState<CellSelectedRangeWithCells[]>([]);
    public rows = new DataGridState<Row<TRow>[]>([], { useDeepEqual: false });
    public headers = new DataGridState<ColumnHeader[]>([], { useDeepEqual: false });
    public footers = new DataGridState<ColumnFooter[]>([], { useDeepEqual: false });
};
