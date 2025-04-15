import type { CellCoordinates, Id, RowData } from '../types';
import { getCoordinatesById, getCellId } from '../utils/cellUtils';
import { DataGridStates } from './DataGridStates';

type Offset = [number, number];

interface GetCellCoordinatesParams {
    readonly maxRow: number;
    readonly maxCol: number;
    readonly from: Id | null;
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
        const { activeCell, selectedAreas } = this.state;
        const newSelectedArea = {
            start: getCellId(startPoint),
            end: getCellId(startPoint)
        };

        activeCell.set({
            id: getCellId(startPoint),
            ...startPoint,
        });

        selectedAreas.set((prevSelectedAreas) => {
            const selectedAreas = [...prevSelectedAreas];
            selectedAreas.push(newSelectedArea);
            return selectedAreas;
        });
    };

    public cleanSelection = ({
        maintainActiveCell = false,
        maintainEditing = false,
    } = {}) => {
        const { editing, activeCell, selectedAreas } = this.state;

        if (!maintainActiveCell) {
            activeCell.set(null);
        }
        if (!maintainEditing) {
            editing.set(false);
        }
        selectedAreas.set([]);
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
            id: getCellId(coord),
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

    public selectArea = (start: Id, end: Id) => {
        const { selectedAreas } = this.state;
        selectedAreas.set((prevSelectedAreas) => {
            const newSelectedArea = { start, end };
            const selectedAreas = [...prevSelectedAreas];
            selectedAreas.push(newSelectedArea);
            return selectedAreas;
        });
    };

    public updateLastSelectedArea = (endCell: Id) => {
        const { selectedAreas } = this.state;
        selectedAreas.set((prevSelectedAreas) => {
            if (prevSelectedAreas.length === 0) {
                return prevSelectedAreas;
            }
            const lastSelectedArea = prevSelectedAreas[prevSelectedAreas.length - 1];
            const newSelectedArea = { ...lastSelectedArea, end: endCell };
            const selectedAreas = [...prevSelectedAreas];
            selectedAreas[selectedAreas.length - 1] = newSelectedArea;
            return selectedAreas;
        });
    };

    public expandLeft = () => {
        const { selectedAreas } = this.state;
        const lastSelectedArea = selectedAreas.value[selectedAreas.value.length - 1];
        if (!lastSelectedArea) {
            return;
        }

        const { end } = lastSelectedArea;
        const newEnd = findCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            from: end,
            offset: directions.left,
        });

        if (!newEnd) {
            return;
        }

        const cellId = getCellId(newEnd);
        this.updateLastSelectedArea(cellId);
    };

    public expandRight = () => {
        const { selectedAreas } = this.state;
        const lastSelectedArea = selectedAreas.value[selectedAreas.value.length - 1];
        if (!lastSelectedArea) {
            return;
        }

        const { end } = lastSelectedArea;
        const newEnd = findCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            from: end,
            offset: directions.right,
        });
        if (!newEnd) {
            return;
        }

        const cellId = getCellId(newEnd);
        this.updateLastSelectedArea(cellId);
    };

    public expandUpper = () => {
        const { selectedAreas } = this.state;
        const lastSelectedArea = selectedAreas.value[selectedAreas.value.length - 1];
        if (!lastSelectedArea) {
            return;
        }

        const { end } = lastSelectedArea;
        const newEnd = findCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            from: end,
            offset: directions.up,
        });
        if (!newEnd) {
            return;
        }

        const cellId = getCellId(newEnd);
        this.updateLastSelectedArea(cellId);
    };

    public expandLower = () => {
        const { selectedAreas } = this.state;
        const lastSelectedArea = selectedAreas.value[selectedAreas.value.length - 1];
        if (!lastSelectedArea) {
            return;
        }

        const { end } = lastSelectedArea;
        const newEnd = findCellCoordinates({
            maxRow: this.rowLength,
            maxCol: this.columnLength,
            from: end,
            offset: directions.down,
        });
        if (!newEnd) {
            return;
        }

        const cellId = getCellId(newEnd);
        this.updateLastSelectedArea(cellId);
    };

    public selectAll = () => {
        const { rows, headers } = this.state;
        const from = getCellId({ col: 0, row: 0 });
        const to = getCellId({ col: headers.value.length - 1, row: rows.value.length - 1 });
        this.selectArea(from, to);
    };
};

