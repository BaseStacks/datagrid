import { DataGridPlugin, type DataGridPluginOptions } from '../instances/atomic/DataGridPlugin';
import type { DataGridKeyMap } from '../types';
import { clearAllTextSelection } from '../utils/domUtils';
import { idTypeEquals } from '../utils/idUtils';
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

export class CellSelectionPlugin extends DataGridPlugin<CellSelectionPluginOptions> {
    private handleContainerMouseDown = (event: MouseEvent) => {
        const isClickOutside = !this.container?.contains(event.target as Node);
        if (isClickOutside) {
            this.dataGrid.selection.cleanSelection();
            return;
        }
    };

    private handleContainerMouseUp = () => {
        const { dragging } = this.dataGrid.selection;

        if (!dragging.value) {
            return;
        }

        dragging.set(false);

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
                    ...smallerParts.map((part) => ({
                        ...part,
                        cells: this.dataGrid.selection.getCellsInRange(part.start, part.end),
                    })),
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

    private handleCellMouseDown = (event: MouseEvent) => {
        const { dragging } = this.dataGrid.selection;
        const { activeCell } = this.dataGrid.state;
        const clickedCell = this.dataGrid.layout.getCellByElement(event.currentTarget as HTMLElement);
        if (!clickedCell) {
            throw new Error('Cell not found');
        }

        const { cleanSelection, startSelection, updateLastSelectedRange } = this.dataGrid.selection;

        if (clickedCell.isFocusing) {
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
                updateLastSelectedRange(clickedCell.id);
            }
            else {
                startSelection(clickedCell.coordinates);
            }
        }
        else if (createNewRange) {
            startSelection(clickedCell.coordinates);
        }
        else {
            cleanSelection();
            startSelection(clickedCell.coordinates);
        }

        dragging.set('start');

        setTimeout(() => {
            if (!dragging.value) {
                return;
            }

            dragging.set('dragging');
        }, 150);

        event.preventDefault();
        clearAllTextSelection();
    };

    private handleCellMouseEnter = (event: MouseEvent) => {
        const { dragging } = this.dataGrid.selection;

        if (dragging.value !== 'dragging') {
            return;
        }

        const { selection } = this.dataGrid;

        const cell = this.dataGrid.layout.getCellByElement(event.currentTarget as HTMLElement);
        if (!cell) {
            throw new Error('Cell not found');
        }

        selection.updateLastSelectedRange(cell.id);
    };

    public handleActivate = () => {
        const { keyMap } = this.options;

        window.addEventListener('mousedown', this.handleContainerMouseDown);
        window.addEventListener('mouseup', this.handleContainerMouseUp);

        const watchElements = this.dataGrid.layout.elementsState.watchItems(({ id, item, operation }) => {
            const isCell = idTypeEquals(id, 'cell');
            if (!isCell) {
                return;
            }

            if (operation === 'remove') {
                item.removeEventListener('mousedown', this.handleCellMouseDown);
                item.removeEventListener('mouseenter', this.handleCellMouseEnter);
                return;
            }

            item.addEventListener('mousedown', this.handleCellMouseDown);
            item.addEventListener('mouseenter', this.handleCellMouseEnter);
        });

        
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

        this.unsubscribes.push(watchElements);
        this.unsubscribes.push(() => {
            this.dataGrid.keyBindings.remove(this);

            window.removeEventListener('mousedown', this.handleContainerMouseDown);
            window.removeEventListener('mouseup', this.handleContainerMouseUp);

            this.unsubscribes.forEach(unsubscribe => unsubscribe());
            this.unsubscribes = [];
        });
    };
};
