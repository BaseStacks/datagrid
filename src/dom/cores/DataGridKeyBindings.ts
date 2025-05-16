import { tinykeys } from 'tinykeys';
import type { DataGridKeyMap, RowData, MaybePromise } from '../../host';
import type { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import type { DataGridCommands } from '../../host/cores/DataGridCommands';

export type KeyBindingHandler = (event: KeyboardEvent) => MaybePromise<void | boolean>;

export class DataGridKeyBindings<TRow extends RowData> {
    private unregisterMap = new Map<string, any>();


    constructor(private commands: DataGridCommands) {
    }

    public add = (source: DataGridDomPlugin<TRow>, keyMap: DataGridKeyMap) => {
        const bindingCommands = Object.keys(keyMap);
        const keyBindingMap: Record<string, KeyBindingHandler> = {};
        bindingCommands.forEach((commandId) => {
            const command = this.commands.get(commandId);
            if (!command) {
                throw new Error(`Command ${commandId} not found`);
            }

            const keybinding = Array.isArray(keyMap[commandId]) ? keyMap[commandId] : [keyMap[commandId]];

            keybinding.forEach(key => {
                keyBindingMap[key] = (async (event: KeyboardEvent) => {
                    const executed = await this.commands.execute(commandId);
                    if (!executed) {
                        return;
                    }
                    event.preventDefault();
                });
            });
        });

        const cleanKeyBindings = tinykeys(window, keyBindingMap);

        this.unregisterMap.set(source.toString(), cleanKeyBindings);
    };

    public removeAll = (source: string) => {
        const cleanKeyBindings = this.unregisterMap.get(source);
        if (cleanKeyBindings) {
            cleanKeyBindings();
            this.unregisterMap.delete(source.toString());
        }
    };
};
