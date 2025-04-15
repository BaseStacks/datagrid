import { findCellByRect, findRect, getCursorOffset, mergeRects, type RectType } from '../utils/domRectUtils';
import { DataGridState } from '../instances/atomic/DataGridState';
import { DataGrid } from '../instances/DataGrid';
import type { DataGridPlugin, RowData } from '../types';
import { clearAllTextSelection } from '../utils/domUtils';
import { breakAreaToSmallerPart, isAreaInsideOthers, tryCombineAreas, tryRemoveDuplicates } from '../utils/selectionUtils';

export interface CellSelectionPluginOptions {
}

type DraggingStatus = 'start' | 'dragging' | false;

export class CellSelectionPlugin<TRow extends RowData> implements DataGridPlugin<CellSelectionPluginOptions> {
    private readonly dataGrid: DataGrid<TRow>;
    private unsubscribes: (() => void)[] = [];

    private get container() {
        return this.dataGrid.layout.container;
    }

    private get cellRectMap() {
        return this.dataGrid.layout.cellRectMap;
    }

    private handleMouseDown = (event: MouseEvent) => {
        const { activeCell } = this.dataGrid.state;
        const { cleanSelection, startSelection, updateLastSelectedArea } = this.dataGrid.selection;

        const clickOutside = !this.container?.contains(event.target as Node);
        if (clickOutside) {
            return;
        }

        const rectInfo = this.dataGrid.layout.getIntersectionRect(event);

        if (!rectInfo || !rectInfo.cell) {
            return;
        }

        if (rectInfo.cell.isFocusing) {
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
                updateLastSelectedArea(rectInfo.cell.id);
            }
            else {
                startSelection(rectInfo.cell.coordinates);
            }
        }
        else if (createNewArea) {
            startSelection(rectInfo.cell.coordinates);
        }
        else {
            cleanSelection();
            startSelection(rectInfo.cell.coordinates);
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
        const cellRect = findRect(cursorOffset, [...this.cellRectMap.values()]);
        if (!cellRect) {
            return;
        }

        const hoveringCell = findCellByRect(this.cellRectMap!, cellRect);
        if (!hoveringCell) {
            return;
        }

        selection.updateLastSelectedArea(hoveringCell);
    };

    private stopDragSelect = () => {
        if (!this.state.dragging.value) {
            return;
        }

        this.state.dragging.set(false);
        const { selectedAreas } = this.dataGrid.state;
        if (selectedAreas.value.length > 1) {
            let newSelectedAreas = [...selectedAreas.value];

            const lastSelectedArea = newSelectedAreas[newSelectedAreas.length - 1];
            const insideOthers = isAreaInsideOthers(lastSelectedArea, newSelectedAreas.slice(0, -1));


            if (insideOthers.length) {
                const breakingArea = insideOthers[0];
                const breakingAreaIndex = newSelectedAreas.findIndex((area) => area === breakingArea);
                const smallerParts = breakAreaToSmallerPart(breakingArea, lastSelectedArea);

                newSelectedAreas = [
                    ...newSelectedAreas.slice(0, breakingAreaIndex),
                    ...smallerParts,
                    ...newSelectedAreas.slice(breakingAreaIndex + 1),
                ];

                // Remove the last selected area
                newSelectedAreas.pop();
            }

            const mergedAreas = tryCombineAreas(newSelectedAreas);
            const uniqueAreas = tryRemoveDuplicates(mergedAreas);
            selectedAreas.set(uniqueAreas);
        }
    };

    private startFocus = (event: MouseEvent) => {
        const { activeCell, editing } = this.dataGrid.state;
        const { cleanSelection } = this.dataGrid.selection;
        const clickOutside = !this.container?.contains(event.target as Node);
        if (clickOutside) {
            cleanSelection();
            return;
        }

        const rectInfo = this.dataGrid.layout.getIntersectionRect(event);
        if (rectInfo?.cell.isActive) {
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

    public active = false;

    public state = {
        selectedAreaRects: new DataGridState<RectType[]>([]),
        activeCellRect: new DataGridState<RectType | null>(null),
        dragging: new DataGridState<DraggingStatus>(false),
    };

    public activate = (_options: CellSelectionPluginOptions) => {
        this.active = true;

        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.stopDragSelect);

        this.container!.addEventListener('mousemove', this.onMouseMove);
        this.container!.addEventListener('dblclick', this.startFocus);

        const { activeCell, selectedAreas } = this.dataGrid.state;
        const { selectedAreaRects, activeCellRect } = this.state;

        const unwatchSelectedAreas = selectedAreas.watch((newSelectedAreas) => {
            if (!newSelectedAreas?.length) {
                selectedAreaRects.set([]);
                return;
            }

            const newSelectedAreaRects = newSelectedAreas.map((newSelectedArea) => {
                const startRect = this.dataGrid.layout.getRect(newSelectedArea.start);
                const endRect = this.dataGrid.layout.getRect(newSelectedArea.end);
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

            const rect = this.dataGrid.layout.getRect(nextActiveCell.id);
            activeCellRect.set(rect);
        });

        this.unsubscribes.push(unwatchSelectedAreas, unwatchActiveCell);
    };

    public deactivate = () => {
        if (!this.active) {
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

        this.cellRectMap.clear();

        this.active = false;
    };
};
