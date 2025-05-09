import { tinykeys } from 'tinykeys';
import type { DataGridAction, DataGridKeyMap, RowData, DataGridStates, DataGridEvents, MaybePromise } from '../../host';
import type { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';

export type KeyBindingHandler = (event: KeyboardEvent) => MaybePromise<void | boolean>;

export class DataGridKeyBindings<TRow extends RowData> {
    // @ts-expect-error - Unused state
    private state: DataGridStates<TRow>;
    private events: DataGridEvents<TRow>;

    private deregisterMap = new Map<string, any>();

    constructor(state: DataGridStates<TRow>, events: DataGridEvents<TRow>) {
        this.state = state;
        this.events = events;
    }

    public add = <TKeyMap extends DataGridAction>(source: DataGridDomPlugin<TRow>, keyMap: DataGridKeyMap<TKeyMap>, handlers: Record<TKeyMap, KeyBindingHandler>) => {
        const keyBindingMap: Record<string, KeyBindingHandler> = {};

        const addKeybinding = (action: TKeyMap, handler: (event: KeyboardEvent) => MaybePromise<void | boolean>) => {
            const shortcutKeys = keyMap[action];
            if (!shortcutKeys) return;

            const keys = Array.isArray(shortcutKeys) ? shortcutKeys : [shortcutKeys];

            keys.forEach(key => {
                keyBindingMap[key] = ((event: KeyboardEvent) => {
                    const handled = handler(event);
                    this.events.emit('action-executed', { action });
                    if (handled === false) {
                        return;
                    }
                    event.preventDefault();
                });
            });
        };

        Object.entries(handlers).forEach(([action, handler]) => {
            addKeybinding(action as TKeyMap, handler as KeyBindingHandler);
        });

        const cleanKeyBindings = tinykeys(window, keyBindingMap);

        this.deregisterMap.set(source.toString(), cleanKeyBindings);
    };

    public remove = (source: DataGridDomPlugin<TRow>) => {
        const cleanKeyBindings = this.deregisterMap.get(source.toString());
        if (cleanKeyBindings) {
            cleanKeyBindings();
            this.deregisterMap.delete(source.toString());
        }
    };
};
