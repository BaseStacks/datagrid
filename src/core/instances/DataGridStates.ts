import type { CellCoordinates, ColumnHeader, SelectedArea, Row, RowData, ScrollBehavior, SelectionMode } from '../types';
import { getSelectedArea } from '../utils/cellUtils';
import { DataGridState } from './atomic/DataGridState';

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
            const nextRange: SelectedArea = getSelectedArea(
                this.activeCell.value,
                selectedCellValue
            );
            this.selectedArea.set(nextRange);
        });
    }

    public editing = new DataGridState(false);
    public activeCell = new DataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public lastEditingCell = new DataGridState<CellCoordinates | null>(null);
    public selectedCell = new DataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public selectedArea = new DataGridState<SelectedArea | null>(null);
    public dragging = new DataGridState<SelectionMode>({
        columns: false,
        rows: false,
        active: false,
    });

    public rows = new DataGridState<Row<TRow>[]>([], { useDeepEqual: false });
    public headers = new DataGridState<ColumnHeader[]>([], { useDeepEqual: false });
};
