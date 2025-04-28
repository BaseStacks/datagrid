import { deepEqual } from '../utils/objectUtils';
import { type DataGridStateOptions, type DataGridStateSetOptions } from './DataGridState';
import { EventEmitter } from './EventEmitter';

export interface DataGridArrayStateOperation<TItem> {
    type: 'add' | 'remove' | 'replace';
    item: TItem;
    index: number;
}

export class DataGridArrayState<TItem> {
    private _options: DataGridStateOptions;
    private _events: EventEmitter;
    private _value: TItem[];

    public get value(): TItem[] {
        return this._value;
    }

    constructor(initialValue: TItem[], options: DataGridStateOptions = {}) {
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

    public watchItem(listener: (operation: DataGridArrayStateOperation<TItem>) => void): () => void {
        this._events.on('add_item', listener);
        return () => {
            this._events.off('add_item', listener);
        };
    }

    public set(newValue: TItem[] | ((oldValue: TItem[]) => TItem[]), options: DataGridStateSetOptions = {}): void {
        const { silent } = options;

        const _newValue = typeof newValue === 'function' ? (newValue as (oldValue: TItem[]) => TItem[])(this.value) : newValue;
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

    public add(item: TItem, index?: number): void {
        const usedIndex = index !== undefined ? index : this._value.length;
        this._value.splice(usedIndex, 0, item);
        this._events.emit('add_item', { type: 'add', item, index: usedIndex });
    }

    public remove(index: number): void {
        const removedItem = this._value.splice(index, 1);
        if (removedItem.length === 0) {
            return;
        }
        this._events.emit('remove_item', { type: 'remove', item: removedItem[0], index });
    }

    public replace(index: number, item: TItem): void {
        this._value[index] = item;
        this._events.emit('replace_item', { type: 'replace', item, index });
    }
}
