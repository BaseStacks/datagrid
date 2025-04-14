import { buildRectMap, findCoordByRect, findFromRectMap, findRect, getCursorOffset, mergeRects, type RectType } from '../utils/domRectUtils';
import { DataGridState } from '../instances/atomic/DataGridState';
import { DataGrid } from '../instances/DataGrid';
import type { CellCoordinates, RowData } from '../types';
import { compareCoordinates } from '../utils/cellUtils';
import { clearAllTextSelection } from '../utils/domUtils';

export interface SelectionPluginOptions {
    container: HTMLElement;
}

type DraggingStatus = 'start' | 'dragging' | false;

export class SelectionPlugin<TRow extends RowData> {
    private readonly dataGrid: DataGrid<TRow>;

    private container: HTMLElement | null = null;
    private coordRectMap = new Map<CellCoordinates, RectType | null>();
    private coordElementMap = new Map<CellCoordinates, HTMLElement | null>();

    private unsubscribes: (() => void)[] = [];

    private handleShiftMouseDown = (event: MouseEvent) => {
        if (!event.shiftKey) {
            return;
        }

        const clickOutside = !this.container?.contains(event.target as Node);
        if (clickOutside) {
            return;
        }

        this.coordRectMap = buildRectMap(this.container!, this.coordElementMap);
        const cursorOffset = getCursorOffset(event, this.container!);
        const clickedRect = findRect(cursorOffset, [...this.coordRectMap.values()]);

        if (!clickedRect) {
            return;
        }

        const clickedCellCoord = findCoordByRect(this.coordRectMap!, clickedRect);
        if (!clickedCellCoord) {
            throw new Error('This should never happen!');
        }

        const { selection } = this.dataGrid;
        const { activeCell } = this.dataGrid.state;

        if (activeCell.value) {
            selection.updateLastSelectedArea(clickedCellCoord);
        }
        else {
            selection.startSelection(clickedCellCoord);
        }

        event.preventDefault();
    };

    private handleMouseDown = (event: MouseEvent) => {
        const { activeCell, editing } = this.dataGrid.state;
        const { cleanSelection, startSelection, updateLastSelectedArea } = this.dataGrid.selection;

        const clickOutside = !this.container?.contains(event.target as Node);
        if (clickOutside) {
            return;
        }

        this.coordRectMap = buildRectMap(this.container!, this.coordElementMap);
        const cursorOffset = getCursorOffset(event, this.container!);
        const clickedRect = findRect(cursorOffset, [...this.coordRectMap.values()]);

        if (!clickedRect) {
            return;
        }

        const clickedCellCoord = findCoordByRect(this.coordRectMap!, clickedRect);
        if (!clickedCellCoord) {
            throw new Error('This should never happen!');
        }

        const clickOnActiveCell = compareCoordinates(clickedCellCoord, activeCell.value!);
        const clickedOnEditingCell = clickOnActiveCell && editing.value;
        if (clickedOnEditingCell) {
            cleanSelection({
                maintainActiveCell: true,
                maintainEditing: true,
            });
            return;
        }

        const createNewArea = event.ctrlKey;
        const expandSelection = event.shiftKey;

        if (expandSelection) {
            if (activeCell.value) {
                updateLastSelectedArea(clickedCellCoord);
            }
            else {
                startSelection(clickedCellCoord);
            }
        }
        if (createNewArea) {
            startSelection(clickedCellCoord);
        }
        else {
            cleanSelection();
            startSelection(clickedCellCoord);
        }

        this.state.dragging.set('start');

        setTimeout(() => {
            if (!this.state.dragging.value) {
                return;
            }

            this.state.dragging.set('dragging');
        }, 150);

        event.preventDefault();
        clearAllTextSelection();
    };

    private onMouseMove = (event: MouseEvent) => {
        if (this.state.dragging.value !== 'dragging') {
            return;
        }

        const { selection } = this.dataGrid;

        const cursorOffset = getCursorOffset(event, this.container!);
        const cellRect = findRect(cursorOffset, [...this.coordRectMap.values()]);
        if (!cellRect) {
            return;
        }

        const hoveringCoord = findCoordByRect(this.coordRectMap!, cellRect);
        if (!hoveringCoord) {
            return;
        }


        selection.updateLastSelectedArea(hoveringCoord);
    };

    private stopDragSelect = () => {
        this.state.dragging.set(false);
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
        selectedAreaRects: new DataGridState<RectType[]>([]),
        activeCellRect: new DataGridState<RectType | null>(null),
        dragging: new DataGridState<DraggingStatus>(false),
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

        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.stopDragSelect);

        this.container.addEventListener('mousemove', this.onMouseMove);
        this.container.addEventListener('dblclick', this.startFocus);

        const { activeCell, selectedAreas } = this.dataGrid.state;
        const { selectedAreaRects, activeCellRect } = this.state;

        const unwatchSelectedAreas = selectedAreas.watch((newSelectedAreas) => {
            if (!newSelectedAreas?.length) {
                selectedAreaRects.set([]);
                return;
            }

            const newSelectedAreaRects = newSelectedAreas.map((newSelectedArea) => {
                const startRect = findFromRectMap(this.coordRectMap, newSelectedArea.start);
                const endRect = findFromRectMap(this.coordRectMap, newSelectedArea.end);
                if (!startRect || !endRect) {
                    throw new Error('This should never happen!');
                }

                return mergeRects(startRect, endRect);
            });

            selectedAreaRects.set(newSelectedAreaRects);
        });

        const unwatchActiveCell = activeCell.watch((nextActiveCell) => {
            if (!nextActiveCell) {
                activeCellRect.set(null);
                return;
            }

            const rect = findFromRectMap(this.coordRectMap, nextActiveCell);
            activeCellRect.set(rect);
        });

        this.unsubscribes.push(unwatchSelectedAreas, unwatchActiveCell);
    };

    public deactivate = () => {
        if (!this.isActive) {
            return;
        }

        if (this.container) {
            window.removeEventListener('mousedown', this.handleMouseDown);
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
