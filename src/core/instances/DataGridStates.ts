import { createDataGridState } from '../helpers/datagridHelpers';
import { CellCoordinates, DataGridProps, RangeSelection, RowData, ScrollBehavior, SelectionMode } from '../types';

export class DataGridStates<TRow extends RowData> {
    constructor(options: DataGridProps<TRow>) {
        this.options = options;
    }

    public options: DataGridProps<TRow>;

    public activeCell = createDataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public lastEditingCell = createDataGridState<CellCoordinates | null>(null);
    public selectedCell = createDataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public selectedRange = createDataGridState<RangeSelection | null>(null);
    public dragging = createDataGridState<SelectionMode>({
        columns: false,
        rows: false,
        active: false,
    });
    public editing = createDataGridState(false);
};
