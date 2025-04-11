import { Cell, CellCoordinates, RowData, SelectionMode } from '../types';
import { DataGridStates } from './DataGridStates';

export class DataGridSelection<TRow extends RowData> {
    private getCellCoordinates = (cell: CellCoordinates | null, offset: [number, number]): CellCoordinates | null => {
        const { options } = this.state;
        const { columns, data, stickyRightColumn } = options;
        const hasStickyRightColumn = Boolean(stickyRightColumn);

        // Return null if cell is null
        if (!cell) return null;

        const columnLength = columns.length;
        const maxRow = data.length - 1;

        const [deltaX, deltaY] = offset;

        // Calculate column boundaries
        const minCol = 0;
        const maxCol = columnLength - (hasStickyRightColumn ? 3 : 2);

        // Calculate row boundaries
        const minRow = 0;

        // Create new cell with position clamped within boundaries
        return {
            col: Math.max(minCol, Math.min(maxCol, cell.col + deltaX)),
            row: Math.max(minRow, Math.min(maxRow, cell.row + deltaY)),
        };
    };

    private state: DataGridStates<TRow>;

    constructor(state: DataGridStates<TRow>) {
        this.state = state;
    }

    public isCellDisabled = (rowIndex: number, columnIndex: number) => {
        const { options } = this.state;
        const { columns } = options;

        const column = columns[columnIndex];

        if (column) {
            const disabled = column.disabled;
            return typeof disabled === 'function' ? disabled({ rowData: {}, rowIndex }) : disabled;
        }
        return false;
    };

    public cleanSelection = (maintainActive = false) => {
        const { selectedCell, editing, activeCell, selectedRange } = this.state;

        if (!maintainActive) {
            activeCell.set(null);
        }
        selectedCell.set(null);
        editing.set(false);
        selectedRange.set(null);
    };

    public active = (cell: Cell) => {
        const { activeCell, selectedCell, selectedRange } = this.state;
        activeCell.set(cell.coordinates);
        selectedCell.set(null);
        selectedRange.set(null);
    };

    public goRight = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const direction: [number, number] = [1, 0];
        editing.set(false);
        activeCell.set((cell) => this.getCellCoordinates(cell, direction));
        selectedCell.set(null);
    };

    public goLeft = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const direction: [number, number] = [-1, 0];
        selectedCell.set(null);
        editing.set(false);
        activeCell.set((cell) => this.getCellCoordinates(cell, direction));
    };

    public goDown = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const direction: [number, number] = [0, 1];
        editing.set(false);
        activeCell.set((cell) => this.getCellCoordinates(cell, direction));
        selectedCell.set(null);
    };

    public goUp = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const direction: [number, number] = [0, -1];
        editing.set(false);
        activeCell.set((cell) => this.getCellCoordinates(cell, direction));
        selectedCell.set(null);
    };

    public jumpRight = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const { columns } = this.state.options;

        const direction: [number, number] = [columns.length, 0];
        activeCell.set((cell) => this.getCellCoordinates(cell, direction));
        selectedCell.set(null);
        editing.set(false);
    };

    public jumpLeft = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const { columns } = this.state.options;

        const direction: [number, number] = [-columns.length, 0];
        activeCell.set((cell) => this.getCellCoordinates(cell, direction));
        selectedCell.set(null);
        editing.set(false);
    };

    public jumpDown = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const { data } = this.state.options;

        const direction: [number, number] = [0, data.length];
        activeCell.set((cell) => this.getCellCoordinates(cell, direction));
        selectedCell.set(null);
        editing.set(false);
    };

    public jumpUp = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const { data } = this.state.options;

        const direction: [number, number] = [0, -data.length];
        activeCell.set((cell) => this.getCellCoordinates(cell, direction));
        selectedCell.set(null);
        editing.set(false);
    };

    public selectLeft = () => {
        const { selectedCell } = this.state;
        const direction: [number, number] = [-1, 0];
        selectedCell.set((cell) => this.getCellCoordinates(cell, direction));
    };

    public selectRight = () => {
        const { selectedCell } = this.state;
        const direction: [number, number] = [1, 0];
        selectedCell.set((cell) => this.getCellCoordinates(cell, direction));
    };

    public selectDown = () => {
        const { selectedCell } = this.state;
        const direction: [number, number] = [0, 1];
        selectedCell.set((cell) => this.getCellCoordinates(cell, direction));
    };

    public selectUp = () => {
        const { selectedCell } = this.state;
        const direction: [number, number] = [0, -1];
        selectedCell.set((cell) => this.getCellCoordinates(cell, direction));
    };

    public selectAll = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const { columns, data } = this.state.options;
        const hasStickyRightColumn = Boolean(this.state.options.stickyRightColumn);

        editing.set(false);
        activeCell.set({
            col: 0,
            row: 0,
            doNotScrollY: true,
            doNotScrollX: true,
        });
        selectedCell.set({
            col: columns.length - (hasStickyRightColumn ? 3 : 2),
            row: data.length - 1,
            doNotScrollY: true,
            doNotScrollX: true,
        });
    };

    private isRangeSelection = false;

    public startRangeSelection = (cell: Cell) => {
        const delay = 150;
        this.isRangeSelection = true;

        setTimeout(() => {
            if (!this.isRangeSelection) {
                return;
            }
            const dragging = {
                columns: cell.coordinates.col !== -1,
                rows: cell.coordinates.row !== -1,
                active: true,
            };

            this.state.dragging.set(dragging);
        }, delay);
    };

    public updateRangeSelection = (cell: Cell) => {
        if (!this.state.dragging.value.active) {
            return;
        }

        const { dragging, selectedCell } = this.state;
        const { data, columns } = this.state.options;

        const lastColumnIndex = columns.length - 1;

        selectedCell.set({
            col: dragging.value.columns
                ? Math.max(0, Math.min(lastColumnIndex, cell.coordinates.col))
                : lastColumnIndex,
            row: dragging.value.rows
                ? Math.max(0, cell.coordinates.row)
                : data.length - 1,
            doNotScrollX: !dragging.value.columns,
            doNotScrollY: !dragging.value.rows,
        });
        // implementation
    };

    public stopRangeSelection = () => {
        this.isRangeSelection = false;
        this.state.dragging.set({
            columns: false,
            rows: false,
            active: false,
        });
    };

    public startDragging = (dragSelect: Omit<SelectionMode, 'active'>) => {
        const { dragging } = this.state;

        dragging.set({
            ...dragSelect,
            active: true,
        });
    };

    public stopDragging = () => {
        const { dragging } = this.state;

        dragging.set({
            columns: false,
            rows: false,
            active: false,
        });
    };
};

