import type { CellCoordinates, CellId, RowData, RectType, SelectedCell, CellSelectionDraggingStatus } from '../types';
import { getCoordinatesById, createCellId } from '../utils/cellUtils';
import { DataGridState } from '../atomic/DataGridState';
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
        columnIndex: Math.max(minCol, Math.min(maxCol, cellCoordinates.columnIndex + deltaX)),
        rowIndex: Math.max(minRow, Math.min(maxRow, cellCoordinates.rowIndex + deltaY)),
    };
};

export class DataGridSelection<TRow extends RowData> {
    private readonly state: DataGridStates<TRow>;

    get rowLength() {
        return this.state.rows.value.length - 1;
    }

    get columnLength() {
        return this.state.headers.value.length - 1;
    }

    constructor(state: DataGridStates<TRow>) {
        this.state = state;
    }

    public selectedRangeRects = new DataGridState<RectType[]>([]);
    public activeCellRect = new DataGridState<RectType | null>(null);
    public dragging = new DataGridState<CellSelectionDraggingStatus>(false);

    public getCellsInRange(start: CellId, end: CellId): Map<CellId, SelectedCell> {
        const startCoord = getCoordinatesById(start);
        const endCoord = getCoordinatesById(end);

        const cells = new Map<CellId, SelectedCell>();
        const startRow = Math.min(startCoord.rowIndex, endCoord.rowIndex);
        const endRow = Math.max(startCoord.rowIndex, endCoord.rowIndex);
        const startCol = Math.min(startCoord.columnIndex, endCoord.columnIndex);
        const endCol = Math.max(startCoord.columnIndex, endCoord.columnIndex);

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const cellId = createCellId({ rowIndex: row, columnIndex: col });
                const cell: SelectedCell = { edges: [] };
                if (row === startRow) {
                    cell.edges.push('top');
                }
                if (row === endRow) {
                    cell.edges.push('bottom');
                }
                if (col === startCol) {
                    cell.edges.push('left');
                }
                if (col === endCol) {
                    cell.edges.push('right');
                }
                cells.set(cellId, cell);
            }
        }

        return cells;
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

        if (!selectionStart) {
            return;
        }

        const cellId = createCellId(selectionStart);

        const cellAttributes = this.state.getCellAttributes(cellId);
        if (!cellAttributes) {
            return;
        }

        if (cellAttributes.selectable === false) {
            return;
        }

        this.cleanSelection();
        this.startSelection(selectionStart);
    };

    public startSelection = (startPoint: CellCoordinates) => {
        const { activeCell, selectedRanges } = this.state;
        const newSelectedRange = {
            start: createCellId(startPoint),
            end: createCellId(startPoint),
            cells: new Map(),
        };

        newSelectedRange.cells.set(newSelectedRange.start, { edges: ['top', 'left', 'bottom', 'right'] });

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

    public selectRange = (startCell: CellId, endCell: CellId, clear: boolean = true) => {
        const { selectedRanges } = this.state;

        const startCellAttributes = this.state.getCellAttributes(startCell);
        const endCellAttributes = this.state.getCellAttributes(endCell);
        if (!startCellAttributes || !endCellAttributes) {
            return;
        }

        if (startCellAttributes.selectable === false || endCellAttributes.selectable === false) {
            return;
        }

        const newSelectedRange = {
            start: startCell,
            end: endCell,
            cells: this.getCellsInRange(startCell, endCell),
        };

        if (clear) {
            selectedRanges.set([newSelectedRange]);
        }

        selectedRanges.set([...selectedRanges.value.slice(0, -1), newSelectedRange]);
    };

    public updateLastSelectedRange = (endCell: CellId) => {
        const { selectedRanges } = this.state;
        if (selectedRanges.value.length === 0) {
            return;
        }

        const lastSelectedRange = selectedRanges.value[selectedRanges.value.length - 1];
        this.selectRange(lastSelectedRange.start, endCell, false);
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
        const from = createCellId({ columnIndex: 0, rowIndex: 0 });
        const to = createCellId({ columnIndex: headers.value.length - 1, rowIndex: rows.value.length - 1 });

        this.cleanSelection();
        this.selectRange(from, to);
    };
};

