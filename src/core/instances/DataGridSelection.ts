import type { CellCoordinates, CellId, RowData } from '../types';
import { getCoordinatesById, createCellId } from '../utils/cellUtils';
import { DataGridStates } from './DataGridStates';

type Offset = [number, number];

interface GetCellCoordinatesParams {
    readonly maxRow: number;
    readonly maxCol: number;
    readonly from: CellId | null;
    readonly offset: [number, number];
}

const directions: Record<string, Offset> = {
    right: [1, 0],
    left: [-1, 0],
    down: [0, 1],
    up: [0, -1],
};

const findCellCoordinates = ({ maxRow, maxCol, from, offset }: GetCellCoordinatesParams): CellCoordinates | null => {
    // Return null if cell is null
    if (!from) return null;

    const [deltaX, deltaY] = offset;

    // Calculate column boundaries
    const minCol = 0;
    // Calculate row boundaries
    const minRow = 0;

    const cellCoordinates = getCoordinatesById(from);
    return {
        col: Math.max(minCol, Math.min(maxCol, cellCoordinates.col + deltaX)),
        row: Math.max(minRow, Math.min(maxRow, cellCoordinates.row + deltaY)),
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
        if (!activeCell.value) {
            return;
        }
        const selectionStart = findCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            from: activeCell.value.id,
            offset: relativeOffset,
        });
        this.cleanSelection();
        this.startSelection(selectionStart!);
    };

    public startSelection = (startPoint: CellCoordinates) => {
        const { activeCell, selectedRanges } = this.state;
        const newSelectedRange = {
            start: createCellId(startPoint),
            end: createCellId(startPoint)
        };

        activeCell.set({
            id: createCellId(startPoint),
            ...startPoint,
        });

        selectedRanges.set((prevSelectedRanges) => {
            const selectedRanges = [...prevSelectedRanges];
            selectedRanges.push(newSelectedRange);
            return selectedRanges;
        });
    };

    public cleanSelection = ({
        maintainActiveCell = false,
        maintainEditing = false,
    } = {}) => {
        const { editing, activeCell, selectedRanges } = this.state;

        if (!maintainActiveCell) {
            activeCell.set(null);
        }
        if (!maintainEditing) {
            editing.set(false);
        }
        selectedRanges.set([]);
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

    public active = (coord: CellCoordinates) => {
        const { activeCell } = this.state;
        activeCell.set({
            id: createCellId(coord),
            ...coord
        });
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

    public selectRange = (start: CellId, end: CellId) => {
        const { selectedRanges } = this.state;
        selectedRanges.set((prevSelectedRanges) => {
            const newSelectedRange = { start, end };
            const selectedRanges = [...prevSelectedRanges];
            selectedRanges.push(newSelectedRange);
            return selectedRanges;
        });
    };

    public updateLastSelectedRange = (endCell: CellId) => {
        const { selectedRanges } = this.state;
        selectedRanges.set((prevSelectedRanges) => {
            if (prevSelectedRanges.length === 0) {
                return prevSelectedRanges;
            }
            const lastSelectedRange = prevSelectedRanges[prevSelectedRanges.length - 1];
            const newSelectedRange = { ...lastSelectedRange, end: endCell };
            const selectedRanges = [...prevSelectedRanges];
            selectedRanges[selectedRanges.length - 1] = newSelectedRange;
            return selectedRanges;
        });
    };

    public expandLeft = () => {
        const { selectedRanges } = this.state;
        const lastSelectedRange = selectedRanges.value[selectedRanges.value.length - 1];
        if (!lastSelectedRange) {
            return;
        }

        const { end } = lastSelectedRange;
        const newEnd = findCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            from: end,
            offset: directions.left,
        });

        if (!newEnd) {
            return;
        }

        const cellId = createCellId(newEnd);
        this.updateLastSelectedRange(cellId);
    };

    public expandRight = () => {
        const { selectedRanges } = this.state;
        const lastSelectedRange = selectedRanges.value[selectedRanges.value.length - 1];
        if (!lastSelectedRange) {
            return;
        }

        const { end } = lastSelectedRange;
        const newEnd = findCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            from: end,
            offset: directions.right,
        });
        if (!newEnd) {
            return;
        }

        const cellId = createCellId(newEnd);
        this.updateLastSelectedRange(cellId);
    };

    public expandUpper = () => {
        const { selectedRanges } = this.state;
        const lastSelectedRange = selectedRanges.value[selectedRanges.value.length - 1];
        if (!lastSelectedRange) {
            return;
        }

        const { end } = lastSelectedRange;
        const newEnd = findCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            from: end,
            offset: directions.up,
        });
        if (!newEnd) {
            return;
        }

        const cellId = createCellId(newEnd);
        this.updateLastSelectedRange(cellId);
    };

    public expandLower = () => {
        const { selectedRanges } = this.state;
        const lastSelectedRange = selectedRanges.value[selectedRanges.value.length - 1];
        if (!lastSelectedRange) {
            return;
        }

        const { end } = lastSelectedRange;
        const newEnd = findCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            from: end,
            offset: directions.down,
        });
        if (!newEnd) {
            return;
        }

        const cellId = createCellId(newEnd);
        this.updateLastSelectedRange(cellId);
    };

    public selectAll = () => {
        const { rows, headers } = this.state;
        const from = createCellId({ col: 0, row: 0 });
        const to = createCellId({ col: headers.value.length - 1, row: rows.value.length - 1 });
        this.selectRange(from, to);
    };
};

