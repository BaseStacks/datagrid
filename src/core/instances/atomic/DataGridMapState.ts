import { deepEqual } from '../../utils/objectUtils';
import type { DataGridStateOptions, DataGridStateSetOptions } from './DataGridState';
import { EventEmitter } from './EventEmitter';

export interface DataGridMapStateOperation<TItemId, TItemData> {
    operation: 'add' | 'remove' | 'replace' | 'watch';
    id: TItemId;
    item: TItemData;
}

export class DataGridMapState<TItemId, TItem> {
    private _options: DataGridStateOptions;
    private _events: EventEmitter;
    private _value: Map<TItemId, TItem>;

    private _getItemEventName(itemId: TItemId): string {
        return `item_change:${itemId}`;
    }

    public get value() {
        return this._value;
    }

    constructor(initialValue: Map<TItemId, TItem> = new Map(), options: DataGridStateOptions = {}) {
        this._value = initialValue;
        this._options = options;
        this._events = new EventEmitter();
    }

    public watch(listener: (value: TItem[]) => void): () => void {
        this._events.on('update_value', listener);
        return () => {
            this._events.off('update_value', listener);
        };
    }

    public watchItems(listener: (operation: DataGridMapStateOperation<TItemId, TItem>) => void): () => void {
        this._events.on('item_change', listener);
        this._value.forEach((item, id) => {
            this._events.emit('item_change', { operation: 'watch', item, id });
        });
        return () => {
            this._events.off('item_change', listener);
        };
    }

    public watchItem(itemId: TItemId, listener: (operation: DataGridMapStateOperation<TItemId, TItem>) => void): () => void {
        const eventName = this._getItemEventName(itemId);
        this._events.on(eventName, listener);

        if (this._value.has(itemId)) {
            this._events.emit(eventName, { operation: 'watch', item: this._value.get(itemId), id: itemId });
        }

        return () => {
            this._events.off(eventName, listener);
        };
    }

    public set(newValue: Map<TItemId, TItem> | ((oldValue: Map<TItemId, TItem>) => Map<TItemId, TItem>), options: DataGridStateSetOptions = {}): void {
        const { silent } = options;

        const _newValue = typeof newValue === 'function' ? (newValue as (oldValue: Map<TItemId, TItem>) => Map<TItemId, TItem>)(this.value) : newValue;
        if (_newValue === this.value) {
            return;
        }

        if (this._options.useDeepEqual) {
            const isEqual = deepEqual(this.value, _newValue);
            if (isEqual) {
                return;
            }
        }

        this._value = _newValue;

        if (!silent) {
            this._events.emit('update_value', this.value);
        }
    }

    public addItem(itemId: TItemId, item: TItem): void {
        const hasItem = this._value.has(itemId);
        if (hasItem) {
            throw new Error(`Item with id ${itemId} already exists`);
        }

        this._value.set(itemId, item);
        const eventName = this._getItemEventName(itemId);

        const eventPayload = { 
            operation: 'add',
            item,
            id: itemId
        };
        this._events.emit(eventName, eventPayload);
        this._events.emit('item_change', eventPayload);
    }

    public removeItem(itemId: TItemId): void {
        const removedItem = this._value.get(itemId);
        if (!removedItem) {
            throw new Error(`Item with id ${itemId} does not exist`);
        }

        this._value.delete(itemId);
        const eventName = this._getItemEventName(itemId);
        const eventPayload = { 
            operation: 'remove',
            item: removedItem,
            id: itemId
        };
        this._events.emit(eventName, eventPayload);
        this._events.emit('item_change', eventPayload);
    }

    public replaceItem(itemId: TItemId, item: TItem): void {
        const hasItem = this._value.has(itemId);
        if (!hasItem) {
            throw new Error(`Item with id ${itemId} does not exist`);
        }

        this._value.set(itemId, item);

        const eventName = this._getItemEventName(itemId);
        const eventPayload = { 
            operation: 'replace',
            item,
            id: itemId
        };
        this._events.emit(eventName, eventPayload);
        this._events.emit('item_change', eventPayload);
    }

    public clear(): void {
        this._value.clear();
        this._events.emit('clear', {});
    }

    //#region Helpers
    public get(id: TItemId): TItem | undefined {
        return this._value.get(id);
    }

    public forEach(callback: (item: TItem, id: TItemId) => void): void {
        this._value.forEach(callback);
    }

    public values() {
        return this._value.values();
    }

    public entries() {
        return this._value.entries();
    }

    public findKey(target: TItem): TItemId | undefined {
        for (const [key, item] of this._value.entries()) {
            if (target === item) {
                return key;
            }
        }
        return undefined;
    }
    //#endregion
}
