import type { CellId, RowData } from '../../host';
import { getCoordinatesById, idTypeEquals, breakRangeToSmallerPart, isRangeInsideOthers, tryCombineRanges, tryRemoveDuplicates } from '../../host';
import { DataGridDomPlugin, type DataGridDomPluginOptions } from '../atomic/DataGridDomPlugin';
import type { DataGridCellNode } from '../cores/DataGridLayout';
import { clearAllTextSelection } from '../utils/domUtils';

type CellSelectionPluginShortcut =
    | 'moveLower'
    | 'moveUpper'
    | 'moveLeft'
    | 'moveRight'
    | 'jumpBottom'
    | 'jumpTop'
    | 'jumpLeft'
    | 'jumpRight'
    | 'expandRight'
    | 'expandLeft'
    | 'expandLower'
    | 'expandUpper'
    | 'selectAll'
    | 'cleanSelection';

export interface CellSelectionPluginOptions extends DataGridDomPluginOptions {
    readonly keyMap?: Record<CellSelectionPluginShortcut, string | string[]>;
}

export const defaultKeyMap: Record<CellSelectionPluginShortcut, string | string[]> = {
    moveLower: 'ArrowDown',
    moveUpper: 'ArrowUp',
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',

    jumpBottom: '$mod+ArrowDown',
    jumpTop: '$mod+ArrowUp',
    jumpLeft: '$mod+ArrowLeft',
    jumpRight: '$mod+ArrowRight',

    expandRight: 'Shift+ArrowRight',
    expandLeft: 'Shift+ArrowLeft',
    expandUpper: 'Shift+ArrowUp',
    expandLower: 'Shift+ArrowDown',

    selectAll: '$mod+a',
    cleanSelection: 'Escape'
};

export class CellSelectionPlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, CellSelectionPluginOptions> {
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
        const nodeInfo = this.dataGrid.layout.getNodeByElement(event.currentTarget as HTMLElement) as DataGridCellNode;
        if (!nodeInfo) {
            throw new Error('Node not found');
        }
        const cellId = nodeInfo.id;
        const header = this.dataGrid.state.headers.value.find((header) => header.id === nodeInfo.headerId);
        if (!header) {
            throw new Error(`Header not found for cell with id ${cellId}`);
        }

        const { selectable } = header.column;
        if(selectable === false) {
            return;
        }

        const { dragging, cleanSelection, startSelection, updateLastSelectedRange } = this.dataGrid.selection;
        const { activeCell, editing } = this.dataGrid.state;

        const isFocusing = activeCell.value?.id === cellId && editing.value;

        if (isFocusing) {
            cleanSelection({
                maintainActiveCell: true,
                maintainEditing: true,
            });
            return;
        }

        const createNewRange = event.ctrlKey;
        const expandSelection = event.shiftKey;

        const coordinates = getCoordinatesById(cellId);

        if (expandSelection) {
            if (activeCell.value) {
                updateLastSelectedRange(cellId);
            }
            else {
                startSelection(coordinates);
            }
        }
        else if (createNewRange) {
            startSelection(coordinates);
        }
        else {
            cleanSelection();
            startSelection(coordinates);
        }

        dragging.set('start');

        setTimeout(() => {
            if (!dragging.value) {
                return;
            }

            dragging.set('dragging');
        }, 100);

        event.preventDefault();
        clearAllTextSelection();
    };

    private handleCellMouseEnter = (event: MouseEvent) => {
        const { dragging } = this.dataGrid.selection;

        if (dragging.value !== 'dragging') {
            return;
        }

        const { selection } = this.dataGrid;

        const node = this.dataGrid.layout.getNodeByElement(event.currentTarget as HTMLElement);
        if (!node || node.type !== 'cell') {
            return;
        }

        selection.updateLastSelectedRange(node.id as CellId);
    };

    public handleActivate = () => {
        const { keyMap } = this.options;

        window.addEventListener('mousedown', this.handleContainerMouseDown);
        window.addEventListener('mouseup', this.handleContainerMouseUp);

        const watchElements = this.dataGrid.layout.layoutNodesState.watchItems(({ id, item, operation }) => {
            const isCell = idTypeEquals(id, 'cell');
            if (!isCell) {
                return;
            }

            const { element } = item;

            if (operation === 'remove') {
                element.removeEventListener('mousedown', this.handleCellMouseDown);
                element.removeEventListener('mouseenter', this.handleCellMouseEnter);
                return;
            }

            element.addEventListener('mousedown', this.handleCellMouseDown);
            element.addEventListener('mouseenter', this.handleCellMouseEnter);
        });

        const pluginName = this.constructor.name;
        this.dataGrid.commands.register([
            { id: 'moveLeft', source: pluginName, execute: this.dataGrid.selection.moveLeft },
            { id: 'moveRight', source: pluginName, execute: this.dataGrid.selection.moveRight },
            { id: 'moveUpper', source: pluginName, execute: this.dataGrid.selection.moveUp },
            { id: 'moveLower', source: pluginName, execute: this.dataGrid.selection.moveDown },
            { id: 'jumpBottom', source: pluginName, execute: this.dataGrid.selection.jumpBottom },
            { id: 'jumpTop', source: pluginName, execute: this.dataGrid.selection.jumpTop },
            { id: 'jumpLeft', source: pluginName, execute: this.dataGrid.selection.jumpLeft },
            { id: 'jumpRight', source: pluginName, execute: this.dataGrid.selection.jumpRight },
            { id: 'expandLeft', source: pluginName, execute: this.dataGrid.selection.expandLeft },
            { id: 'expandRight', source: pluginName, execute: this.dataGrid.selection.expandRight },
            { id: 'expandUpper', source: pluginName, execute: this.dataGrid.selection.expandUpper },
            { id: 'expandLower', source: pluginName, execute: this.dataGrid.selection.expandLower },
            { id: 'selectAll', source: pluginName, execute: this.dataGrid.selection.selectAll },
            { id: 'cleanSelection', source: pluginName, execute: this.dataGrid.selection.cleanSelection }
        ]);

        this.dataGrid.keyBindings.add(this, {
            ...defaultKeyMap,
            ...keyMap
        });

        this.unsubscribes.push(watchElements);
        this.unsubscribes.push(() => {
            this.dataGrid.commands.unregisterAll(pluginName);
            this.dataGrid.keyBindings.removeAll(pluginName);

            window.removeEventListener('mousedown', this.handleContainerMouseDown);
            window.removeEventListener('mouseup', this.handleContainerMouseUp);
        });
    };
};
