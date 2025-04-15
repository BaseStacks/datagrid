import type { CellCoordinates, ColumnHeader, CellSelectedRange, Row, RowData, WithId } from '../types';
import { DataGridState } from './atomic/DataGridState';

export class DataGridStates<TRow extends RowData> {
    constructor() {}
    public editing = new DataGridState(false);
    public activeCell = new DataGridState<WithId<CellCoordinates> | null>(null);
    public lastEditingCell = new DataGridState<WithId<CellCoordinates> | null>(null);
    public selectedRanges = new DataGridState<CellSelectedRange[]>([]);
    public rows = new DataGridState<Row<TRow>[]>([], { useDeepEqual: false });
    public headers = new DataGridState<ColumnHeader[]>([], { useDeepEqual: false });
};
