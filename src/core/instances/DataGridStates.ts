import { createDataGridState } from '../helpers/datagridHelpers';
import { CellCoordinates, ColumnHeader, RangeSelection, Row, RowData, ScrollBehavior, SelectionMode } from '../types';

export class DataGridStates<TRow extends RowData> {
    constructor() {
        this.selectedCell.watch((selectedCell) => {
            // Active cell and Selected cell are two corner points of the selection
            if (!selectedCell || !this.activeCell.value) {
                if (this.selectedRange.value) {
                    this.selectedRange.set(null);
                }
                return;
            }

            const nextRange: RangeSelection = {
                min: {
                    col: Math.min(this.activeCell.value.col, selectedCell.col),
                    row: Math.min(this.activeCell.value.row, selectedCell.row),
                },
                max: {
                    col: Math.max(this.activeCell.value.col, selectedCell.col),
                    row: Math.max(this.activeCell.value.row, selectedCell.row),
                },
            };
            // Update the selected range
            this.selectedRange.set(nextRange);
        });
    }

    public editing = createDataGridState(false);
    public activeCell = createDataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public lastEditingCell = createDataGridState<CellCoordinates | null>(null);
    public selectedCell = createDataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public selectedRange = createDataGridState<RangeSelection | null>(null);
    public dragging = createDataGridState<SelectionMode>({
        columns: false,
        rows: false,
        active: false,
    });

    public rows = createDataGridState<Row<TRow>[]>([], { useDeepEqual: false });
    public headers = createDataGridState<ColumnHeader[]>([], { useDeepEqual: false });
};
