import { buildRectMap, findCoordByRect, findFromRectMap, findRect, getCursorOffset, mergeRects, RectType } from '../../react/utils/domRectUtils';
import { createDataGridState } from '../helpers/datagridHelpers';
import { DataGrid } from '../instances/DataGrid';
import { CellCoordinates, RowData } from '../types';
import { compareCoordinates } from '../utils/cellUtils';

export interface SelectionPluginOptions {
    container: HTMLElement;
}

export class SelectionPlugin<TRow extends RowData> {
    private readonly dataGrid: DataGrid<TRow>;

    private container: HTMLElement | null = null;
    private isDragging = false;
    private coordRectMap = new Map<CellCoordinates, RectType | null>();
    private coordElementMap = new Map<CellCoordinates, HTMLElement | null>();

    private unsubscribes: (() => void)[] = [];

    private startDragSelect = (event: MouseEvent) => {
        const { activeCell, editing, dragging } = this.dataGrid.state;
        const { cleanSelection } = this.dataGrid.selection;

        const clickOutside = !this.container?.contains(event.target as Node);
        if (clickOutside) {
            cleanSelection();
            return;
        }

        this.coordRectMap = buildRectMap(this.container!, this.coordElementMap);
        const cursorOffset = getCursorOffset(event, this.container!);
        const cellRect = findRect(cursorOffset, [...this.coordRectMap.values()]);
        if (!cellRect) {
            cleanSelection();
            return;
        }

        const cellCoord = findCoordByRect(this.coordRectMap!, cellRect);
        if (!cellCoord) {
            throw new Error('This should never happen!');
        }

        const clickOnActiveCell = compareCoordinates(cellCoord, activeCell.value!);
        if (!clickOnActiveCell) {
            activeCell.set(cellCoord);
        }

        const clickedOnEditingCell = clickOnActiveCell && editing.value;
        if (!clickedOnEditingCell) {
            event.preventDefault();
        }

        cleanSelection({
            maintainActiveCell: true,
            maintainEditing: true,
        });

        this.isDragging = true;

        setTimeout(() => {
            if (!this.isDragging) {
                return;
            }

            dragging.set({
                columns: cellCoord.col !== -1,
                rows: cellCoord.row !== -1,
                active: true,
            });
        }, 150);
    };

    private onMouseMove = (event: MouseEvent) => {
        if (!this.isDragging) {
            return;
        }

        const { selectedCell, dragging } = this.dataGrid.state;

        const cursorOffset = getCursorOffset(event, this.container!);
        const cellRect = findRect(cursorOffset, [...this.coordRectMap.values()]);
        if (!cellRect) {
            return;
        }

        const coord = findCoordByRect(this.coordRectMap!, cellRect);
        if (!coord) {
            return;
        }

        const nextSelectedCell = {
            col: coord.col,
            row: coord.row,
            doNotScrollX: !dragging.value.columns,
            doNotScrollY: !dragging.value.rows,
        };

        selectedCell.set(nextSelectedCell);
    };

    private stopDragSelect = () => {
        if (this.isDragging) {
            const { dragging } = this.dataGrid.state;
            dragging.set({
                columns: false,
                rows: false,
                active: false,
            });
        }

        this.isDragging = false;
    };

    private startFocus = (event: MouseEvent) => {
        const { activeCell, editing } = this.dataGrid.state;
        const { cleanSelection } = this.dataGrid.selection;
        const clickOutside = !this.container?.contains(event.target as Node);
        if (clickOutside) {
            cleanSelection();
            return;
        }

        const clickedOnActiveCell = activeCell.value && event.target === this.coordRectMap.get(activeCell.value);
        if (clickedOnActiveCell) {
            return;
        }

        if (activeCell.value) {
            cleanSelection({ maintainActiveCell: true });
            editing.set(true);
            event.preventDefault();
        }
    };

    constructor(dataGrid: DataGrid<TRow>) {
        this.dataGrid = dataGrid;
    }

    public isActive = false;

    public state = {
        selectedAreaRect: createDataGridState<RectType | null>(null),
        activeCellRect: createDataGridState<RectType | null>(null),
    };

    public registerCell = (cell: CellCoordinates, element: HTMLElement | null) => {
        if (element) {
            this.coordElementMap.set(cell, element);
        } else {
            this.coordElementMap.delete(cell);
        }
    };

    public active = ({ container }: SelectionPluginOptions) => {
        this.isActive = true;
        this.container = container;

        window.addEventListener('mousedown', this.startDragSelect);
        window.addEventListener('mouseup', this.stopDragSelect);

        this.container.addEventListener('mousemove', this.onMouseMove);
        this.container.addEventListener('dblclick', this.startFocus);

        const { activeCell, selectedCell, selectedArea } = this.dataGrid.state;
        const { selectedAreaRect: selectionRect, activeCellRect: activeRect } = this.state;

        const unwatchSelectRange = selectedArea.watch((nextSelectedRange) => {
            selectionRect.set(() => {
                if (!nextSelectedRange) {
                    return null;
                }

                const rectA = findFromRectMap(this.coordRectMap, activeCell.value!)!;
                const rectB = findFromRectMap(this.coordRectMap, selectedCell.value!)!;

                return mergeRects(rectA, rectB);
            });
        });

        const unwatchActiveCell = activeCell.watch((nextActiveCell) => {
            activeRect.set(() => {
                if (!nextActiveCell) {
                    return null;
                }

                const rect = findFromRectMap(this.coordRectMap, nextActiveCell);
                return rect;
            });
        });

        this.unsubscribes.push(unwatchSelectRange, unwatchActiveCell);
    };

    public deactivate = () => {
        if (!this.isActive) {
            return;
        }

        if (this.container) {
            window.removeEventListener('mousedown', this.startDragSelect);
            window.removeEventListener('mouseup', this.stopDragSelect);

            this.container.removeEventListener('mousemove', this.onMouseMove);
            this.container.removeEventListener('dblclick', this.startFocus);
        }

        this.unsubscribes.forEach(unsubscribe => unsubscribe());
        this.unsubscribes = [];

        this.coordRectMap.clear();
        this.coordElementMap.clear();
        this.container = null;

        this.isActive = false;
    };

    public reActivate = ({ container }: SelectionPluginOptions) => {
        this.deactivate();
        this.active({ container });
    };
};
