import type { Cell, CellCoordinates, RowData } from '../types';
import { getSelectedArea } from '../utils/cellUtils';
import { DataGridStates } from './DataGridStates';

type Offset = [number, number];

interface GetCellCoordinatesParams {
    readonly maxRow: number;
    readonly maxCol: number;
    readonly cell: CellCoordinates | null;
    readonly offset: [number, number];
}

const directions: Record<string, Offset> = {
    right: [1, 0],
    left: [-1, 0],
    down: [0, 1],
    up: [0, -1],
};

const getCellCoordinates = ({ maxRow, maxCol, cell, offset }: GetCellCoordinatesParams): CellCoordinates | null => {
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

    get rowLength() {
        return this.state.rows.value.length - 1;
    }

    get columnLength() {
        return this.state.headers.value.length - 1;
    }

    constructor(state: DataGridStates<TRow>) {
        this.state = state;
    }

    public navigate = (relativeOffset: Offset) => {
        const { activeCell } = this.state;
        activeCell.set((cell) => getCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            cell,
            offset: relativeOffset,
        }));
    };

    public expand = (relativeOffset: Offset) => {
        const { selectedCell, activeCell } = this.state;
        selectedCell.set((cell) => getCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            cell: cell || activeCell.value,
            offset: relativeOffset,
        }));
    };

    public selectArea = (from: CellCoordinates, to: CellCoordinates) => {
        const { selectedCell, activeCell, selectedArea } = this.state;
        activeCell.set(from, { silent: true });
        selectedCell.set(to, { silent: true });
        const area = getSelectedArea(from, to);
        selectedArea.set(area);
    };

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

    public moveRight = () => this.navigate(directions.right);
    public moveLeft = () => this.navigate(directions.left);
    public moveUp = () => this.navigate(directions.up);
    public moveDown = () => this.navigate(directions.down);

    public jumpRight = () => {
        const { headers } = this.state;
        const endOfRow: Offset = [headers.value.length, 0];
        this.navigate(endOfRow);
    };

    public jumpLeft = () => {
        const { headers } = this.state;
        const startOfRow: Offset = [-headers.value.length, 0];
        this.navigate(startOfRow);
    };

    public jumpBottom = () => {
        const { rows } = this.state;
        const bottomOfColumn: [number, number] = [0, rows.value.length];
        this.navigate(bottomOfColumn);
    };

    public jumpTop = () => {
        const { rows } = this.state;
        const topOfColumn: [number, number] = [0, -rows.value.length];
        this.navigate(topOfColumn);
    };

    public expandLeft = () => this.expand(directions.left);
    public expandRight = () => this.expand(directions.right);
    public expandLower = () => this.expand(directions.down);
    public expandUpper = () => this.expand(directions.up);

    public selectAll = () => {
        const { rows, headers } = this.state;
        const from: CellCoordinates = { col: 0, row: 0 };
        const to: CellCoordinates = { col: headers.value.length - 1, row: rows.value.length - 1 };
        this.selectArea(from, to);
    };
};

