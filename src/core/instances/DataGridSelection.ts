import type { Cell, CellCoordinates, RowData } from '../types';
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
        const { selectedCell, editing, activeCell, selectedArea } = this.state;

        if (!maintainActiveCell) {
            activeCell.set(null);
        }
        if (!maintainEditing) {
            editing.set(false);
        }
        selectedCell.set(null);
        selectedArea.set(null);
    };

    public focus = () => {
        const { activeCell, editing } = this.state;
        if (!activeCell.value) {
            return;
        }
        editing.set(true);
    };

    public blur = () => {
        const { editing } = this.state;
        editing.set(false);
    };

    public active = (cell: Cell) => {
        const { activeCell } = this.state;
        activeCell.set(cell.coordinates);
    };

    public moveRight = () => {
        const { activeCell } = this.state;
        const direction: [number, number] = [1, 0];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public moveLeft = () => {
        const { activeCell } = this.state;
        const direction: [number, number] = [-1, 0];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public moveDown = () => {
        const { activeCell } = this.state;
        const direction: [number, number] = [0, 1];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public moveUp = () => {
        const { activeCell } = this.state;
        const direction: [number, number] = [0, -1];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public jumpRight = () => {
        const { activeCell, headers } = this.state;

        const direction: [number, number] = [headers.value.length, 0];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public jumpLeft = () => {
        const { activeCell, headers } = this.state;
        const direction: [number, number] = [-headers.value.length, 0];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public jumpBottom = () => {
        const { activeCell, rows } = this.state;
        const direction: [number, number] = [0, rows.value.length];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public jumpTop = () => {
        const { activeCell, rows } = this.state;
        const direction: [number, number] = [0, -rows.value.length];
        activeCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell, direction));
    };

    public expandLeft = () => {
        const { selectedCell, activeCell } = this.state;
        const direction: [number, number] = [-1, 0];
        selectedCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell || activeCell.value, direction));
    };

    public expandRight = () => {
        const { selectedCell, activeCell } = this.state;
        const direction: [number, number] = [1, 0];
        selectedCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell || activeCell.value, direction));
    };

    public expandLower = () => {
        const { selectedCell, activeCell } = this.state;
        const direction: [number, number] = [0, -1];
        selectedCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell || activeCell.value, direction));
    };

    public expandUpper = () => {
        const { selectedCell, activeCell } = this.state;
        const direction: [number, number] = [0, 1];
        selectedCell.set((cell) => getCellCoordinates(this.maxRow, this.maxCol, cell || activeCell.value, direction));
    };

    public selectAll = () => {
        const { selectedCell, activeCell, rows, headers } = this.state;

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

