import type { CellCoordinates, ColumnHeader, SelectedArea, Row, RowData, ScrollBehavior } from '../types';
import { DataGridState } from './atomic/DataGridState';

export class DataGridStates<TRow extends RowData> {
    constructor() {}
    public editing = new DataGridState(false);
    public activeCell = new DataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public lastEditingCell = new DataGridState<CellCoordinates | null>(null);
    public selectedAreas = new DataGridState<SelectedArea[]>([]);
    public rows = new DataGridState<Row<TRow>[]>([], { useDeepEqual: false });
    public headers = new DataGridState<ColumnHeader[]>([], { useDeepEqual: false });
};
