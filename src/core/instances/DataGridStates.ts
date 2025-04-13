import { createDataGridState } from '../helpers/datagridHelpers';
import { CellCoordinates, ColumnHeader, RangeSelection, Row, RowData, ScrollBehavior, SelectionMode } from '../types';

export class DataGridStates<TRow extends RowData> {
    constructor() {
        this.activeCell.watch(() => {
            // Clear the selected cell and range when the active cell changes
            this.selectedCell.set(null);
            this.selectedArea.set(null);
            this.editing.set(false);
            this.dragging.set({
                active: false,
                columns: false,
                rows: false
            });
        });

        this.selectedCell.watch((selectedCellValue) => {
            // Active cell and Selected cell are two corner points of the selection
            // If one of them is not set, we clear the SelectedRange
            if (!selectedCellValue || !this.activeCell.value) {
                this.selectedArea.set(null);
                return;
            }

            // If both are set, we calculate the SelectedRange
            const nextRange: RangeSelection = {
                min: {
                    col: Math.min(this.activeCell.value.col, selectedCellValue.col),
                    row: Math.min(this.activeCell.value.row, selectedCellValue.row),
                },
                max: {
                    col: Math.max(this.activeCell.value.col, selectedCellValue.col),
                    row: Math.max(this.activeCell.value.row, selectedCellValue.row),
                },
            };
            this.selectedArea.set(nextRange);
        });
    }

    public editing = createDataGridState(false);
    public activeCell = createDataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public lastEditingCell = createDataGridState<CellCoordinates | null>(null);
    public selectedCell = createDataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public selectedArea = createDataGridState<RangeSelection | null>(null);
    public dragging = createDataGridState<SelectionMode>({
        columns: false,
        rows: false,
        active: false,
    });

    public rows = createDataGridState<Row<TRow>[]>([], { useDeepEqual: false });
    public headers = createDataGridState<ColumnHeader[]>([], { useDeepEqual: false });
};
