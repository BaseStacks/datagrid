import { defaultKeyMap } from '../configs';
import { DataGrid } from '../instances/DataGrid';
import { DataGridAction, DataGridKeyMap, RowData } from '../types';
import { tinykeys, type KeyBindingMap } from 'tinykeys';

export interface KeybindingPluginOptions {
    readonly keyMap?: DataGridKeyMap;
}

export class KeybindingPlugin<TRow extends RowData> {
    private readonly dataGrid: DataGrid<TRow>;

    private cleanKeyBindings?: () => void;

    private preProcessEvent = (event: KeyboardEvent): boolean => {
        const { activeCell } = this.dataGrid.state;

        if (!activeCell.value || event.isComposing) {
            return false;
        }

        return true;;
    };

    constructor(dataGrid: DataGrid<TRow>) {
        this.dataGrid = dataGrid;
    }

    public isActive = false;

    public activate({ keyMap }: KeybindingPluginOptions): void {
        this.isActive = true;

        const handlers: Record<DataGridAction, () => void> = {
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
            focus: this.dataGrid.selection.focus,
        };

        // Define keybindings
        const mergeKeyBindings = {
            ...defaultKeyMap,
            ...keyMap
        };

        const keyBindingMap: KeyBindingMap = {};

        // Helper to add a keybinding for an action
        const addKeybinding = (action: DataGridAction, handler: (event: KeyboardEvent) => void | boolean) => {
            const shortcutKeys = mergeKeyBindings[action];
            if (!shortcutKeys) return;

            const keys = Array.isArray(shortcutKeys) ? shortcutKeys : [shortcutKeys];

            keys.forEach(key => {
                keyBindingMap[key] = ((event: KeyboardEvent) => {
                    if (!this.preProcessEvent(event)) {
                        return;
                    };
                    const handled = handler(event);
                    if (handled === false) {
                        return;
                    }
                    event.preventDefault();
                });
            });
        };

        Object.entries(handlers).forEach(([action, handler]) => {
            addKeybinding(action as DataGridAction, handler);
        });

        this.cleanKeyBindings = tinykeys(window, keyBindingMap);
    }

    public deactivate(): void {
        if (!this.isActive) {
            return;
        };

        if (this.cleanKeyBindings) {
            this.cleanKeyBindings();
            this.cleanKeyBindings = undefined;
        }

        this.isActive = true;
    }
}
