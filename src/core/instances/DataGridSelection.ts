import { Cell, CellCoordinates, RowData } from '../types';
import { DataGridStates } from './DataGridStates';

const getCellCoordinates = (maxRow: number, maxCol: number, cell: CellCoordinates | null, offset: [number, number]): CellCoordinates | null => {
    // Return null if cell is null
    if (!cell) return null;

    const [deltaX, deltaY] = offset;

    // Calculate column boundaries
    const minCol = 0;
    // Calculate row boundaries
    const minRow = 0;

    return {
        col: Math.max(minCol, Math.min(maxCol, cell.col + deltaX)),
        row: Math.max(minRow, Math.min(maxRow, cell.row + deltaY)),
    };
};

export class DataGridSelection<TRow extends RowData> {
    private state: DataGridStates<TRow>;

    get maxRow() {
        return this.state.rows.value.length - 1;
    }

    get maxCol() {
        return this.state.headers.value.length - 1;
    }

    constructor(state: DataGridStates<TRow>) {
        this.state = state;
    }

    public cleanSelection = ({
        maintainActiveCell = false,
        maintainEditing = false,
    } = {}) => {
        const { selectedCell, editing, activeCell, selectedRange } = this.state;

        if (!maintainActiveCell) {
            activeCell.set(null);
        }
        if (!maintainEditing) {
            editing.set(false);
        }
        selectedCell.set(null);
        selectedRange.set(null);
    };

    public active = (cell: Cell) => {
        const { activeCell, selectedCell, selectedRange } = this.state;
        activeCell.set(cell.coordinates);
        selectedCell.set(null);
        selectedRange.set(null);
    };

    public moveRight = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const direction: [number, number] = [1, 0];
        editing.set(false);
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
        selectedCell.set(null);
    };

    public moveLeft = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const direction: [number, number] = [-1, 0];
        selectedCell.set(null);
        editing.set(false);
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public moveDown = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const direction: [number, number] = [0, 1];
        editing.set(false);
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
        selectedCell.set(null);
    };

    public moveUp = () => {
        const { selectedCell, editing, activeCell } = this.state;
        const direction: [number, number] = [0, -1];
        editing.set(false);
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
        selectedCell.set(null);
    };

    public jumpRight = () => {
        const { selectedCell, editing, activeCell, headers } = this.state;

        const direction: [number, number] = [headers.value.length, 0];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
        selectedCell.set(null);
        editing.set(false);
    };

    public jumpLeft = () => {
        const { selectedCell, editing, activeCell, headers } = this.state;

        const direction: [number, number] = [-headers.value.length, 0];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
        selectedCell.set(null);
        editing.set(false);
    };

    public jumpBottom = () => {
        const { selectedCell, editing, activeCell, rows } = this.state;

        const direction: [number, number] = [0, rows.value.length];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
        selectedCell.set(null);
        editing.set(false);
    };

    public jumpTop = () => {
        const { selectedCell, editing, activeCell, rows } = this.state;

        const direction: [number, number] = [0, -rows.value.length];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
        selectedCell.set(null);
        editing.set(false);
    };

    public expandLeft = () => {
        const { selectedCell } = this.state;
        const direction: [number, number] = [-1, 0];
        selectedCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public expandRight = () => {
        const { selectedCell } = this.state;
        const direction: [number, number] = [1, 0];
        selectedCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public expandDown = () => {
        const { selectedCell } = this.state;
        const direction: [number, number] = [0, 1];
        selectedCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public expandUp = () => {
        const { selectedCell } = this.state;
        const direction: [number, number] = [0, -1];
        selectedCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public selectAll = () => {
        const { selectedCell, editing, activeCell, rows, headers } = this.state;

        editing.set(false);
        activeCell.set({
            col: 0,
            row: 0,
            doNotScrollY: true,
            doNotScrollX: true,
        });
        selectedCell.set({
            col: headers.value.length - 1,
            row: rows.value.length - 1,
            doNotScrollY: true,
            doNotScrollX: true,
        });
    };
};

