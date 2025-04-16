import { mergeRects, type RectType } from '../utils/domRectUtils';
import { DataGridState } from '../instances/atomic/DataGridState';
import { DataGrid } from '../instances/DataGrid';
import type { DataGridKeyMap, DataGridPlugin, DataGridPluginOptions, RowData } from '../types';
import { clearAllTextSelection } from '../utils/domUtils';
import { breakRangeToSmallerPart, isRangeInsideOthers, tryCombineRanges, tryRemoveDuplicates } from '../utils/selectionUtils';

type CellSelectionPluginShortcut =
    | 'activeLower'
    | 'activeUpper'
    | 'activeLeft'
    | 'activeRight'
    | 'jumpBottom'
    | 'jumpTop'
    | 'jumpLeft'
    | 'jumpRight'
    | 'expandRight'
    | 'expandLeft'
    | 'expandLower'
    | 'expandUpper'
    | 'selectAll'
    | 'exit';

export interface CellSelectionPluginOptions extends DataGridPluginOptions {
    readonly keyMap?: DataGridKeyMap<CellSelectionPluginShortcut>;
}

export type CellSelectionDraggingStatus = 'start' | 'dragging' | false;


export const defaultKeyMap: DataGridKeyMap<CellSelectionPluginShortcut> = {
    activeLower: 'ArrowDown',
    activeUpper: 'ArrowUp',
    activeLeft: 'ArrowLeft',
    activeRight: 'ArrowRight',

    jumpBottom: '$mod+ArrowDown',
    jumpTop: '$mod+ArrowUp',
    jumpLeft: '$mod+ArrowLeft',
    jumpRight: '$mod+ArrowRight',

    expandRight: 'Shift+ArrowRight',
    expandLeft: 'Shift+ArrowLeft',
    expandUpper: 'Shift+ArrowUp',
    expandLower: 'Shift+ArrowDown',

    selectAll: '$mod+a',
    exit: 'Escape'
};

export class CellSelectionPlugin<TRow extends RowData = RowData> implements DataGridPlugin<CellSelectionPluginOptions> {
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
        const { cleanSelection, startSelection, updateLastSelectedRange } = this.dataGrid.selection;

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

        const createNewRange = event.ctrlKey;
        const expandSelection = event.shiftKey;

        if (expandSelection) {
            if (activeCell.value) {
                updateLastSelectedRange(rectInfo.cell.id);
            }
            else {
                startSelection(rectInfo.cell.coordinates);
            }
        }
        else if (createNewRange) {
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

        const rectInfo = this.dataGrid.layout.getIntersectionRect(event);
        if (!rectInfo || !rectInfo.cell) {
            return;
        }

        selection.updateLastSelectedRange(rectInfo.cell.id);
    };

    private stopDragSelect = () => {
        if (!this.state.dragging.value) {
            return;
        }

        this.state.dragging.set(false);
        const { selectedRanges } = this.dataGrid.state;
        if (selectedRanges.value.length > 1) {
            let newSelectedRanges = [...selectedRanges.value];

            const lastSelectedRange = newSelectedRanges[newSelectedRanges.length - 1];
            const insideOthers = isRangeInsideOthers(lastSelectedRange, newSelectedRanges.slice(0, -1));


            if (insideOthers.length) {
                const breakingRange = insideOthers[0];
                const breakingRangeIndex = newSelectedRanges.findIndex((range) => range === breakingRange);
                const smallerParts = breakRangeToSmallerPart(breakingRange, lastSelectedRange);

                newSelectedRanges = [
                    ...newSelectedRanges.slice(0, breakingRangeIndex),
                    ...smallerParts,
                    ...newSelectedRanges.slice(breakingRangeIndex + 1),
                ];

                // Remove the last selected range
                newSelectedRanges.pop();
            }

            const mergedRanges = tryCombineRanges(newSelectedRanges);
            const uniqueRanges = tryRemoveDuplicates(mergedRanges);
            selectedRanges.set(uniqueRanges);
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

    private addEventListeners = () => {
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.stopDragSelect);

        this.container!.addEventListener('mousemove', this.onMouseMove);
        this.container!.addEventListener('dblclick', this.startFocus);
    };

    private removeEventListeners = () => {
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.stopDragSelect);

        this.container?.removeEventListener('mousemove', this.onMouseMove);
        this.container?.removeEventListener('dblclick', this.startFocus);
    };

    constructor(dataGrid: DataGrid<TRow>) {
        this.dataGrid = dataGrid;
    }

    public active = false;

    public state = {
        selectedRangeRects: new DataGridState<RectType[]>([]),
        activeCellRect: new DataGridState<RectType | null>(null),
        dragging: new DataGridState<CellSelectionDraggingStatus>(false),
    };

    public activate = (_options: CellSelectionPluginOptions) => {
        const { keyMap } = _options;

        this.active = true;

        this.addEventListeners();

        const handlers: Record<CellSelectionPluginShortcut, () => void> = {
            activeLeft: this.dataGrid.selection.moveLeft,
            activeRight: this.dataGrid.selection.moveRight,
            activeUpper: this.dataGrid.selection.moveUp,
            activeLower: this.dataGrid.selection.moveDown,
            jumpBottom: this.dataGrid.selection.jumpBottom,
            jumpTop: this.dataGrid.selection.jumpTop,
            jumpLeft: this.dataGrid.selection.jumpLeft,
            jumpRight: this.dataGrid.selection.jumpRight,
            expandLeft: this.dataGrid.selection.expandLeft,
            expandRight: this.dataGrid.selection.expandRight,
            expandUpper: this.dataGrid.selection.expandUpper,
            expandLower: this.dataGrid.selection.expandLower,
            selectAll: this.dataGrid.selection.selectAll,
            exit: this.dataGrid.selection.cleanSelection,
        };

        // Define keybindings
        const mergeKeyMap = {
            ...defaultKeyMap,
            ...keyMap
        };

        this.dataGrid.keyBindings.add(this, mergeKeyMap, handlers);

        const { activeCell, selectedRanges } = this.dataGrid.state;
        const { selectedRangeRects, activeCellRect } = this.state;

        const unwatchSelectedRanges = selectedRanges.watch((newSelectedRanges) => {
            if (!newSelectedRanges?.length) {
                selectedRangeRects.set([]);
                return;
            }

            const newSelectedRangeRects = newSelectedRanges.map((newSelectedRange) => {
                const startRect = this.dataGrid.layout.getRect(newSelectedRange.start);
                const endRect = this.dataGrid.layout.getRect(newSelectedRange.end);
                if (!startRect || !endRect) {
                    throw new Error('This should never happen!');
                }

                return mergeRects(startRect, endRect);
            });

            selectedRangeRects.set(newSelectedRangeRects);
        });

        const unwatchActiveCell = activeCell.watch((nextActiveCell) => {
            if (!nextActiveCell) {
                activeCellRect.set(null);
                return;
            }

            const rect = this.dataGrid.layout.getRect(nextActiveCell.id);
            activeCellRect.set(rect);
        });

        this.unsubscribes.push(unwatchSelectedRanges, unwatchActiveCell);
    };

    public deactivate = () => {
        if (!this.active) {
            return;
        }

        this.removeEventListeners();
        this.dataGrid.keyBindings.remove(this);

        this.unsubscribes.forEach(unsubscribe => unsubscribe());
        this.unsubscribes = [];

        this.cellRectMap.clear();

        this.active = false;
    };
};
