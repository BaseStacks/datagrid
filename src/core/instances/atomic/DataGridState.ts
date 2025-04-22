import { deepEqual } from '../../utils/objectUtils';
import { EventEmitter } from './EventEmitter';

export interface DataGridStateOptions {
    // If true, the state will use deep equal to check if the value is changed
    readonly useDeepEqual?: boolean;
}

export interface DataGridStateSetOptions {
    // If true, the event will not be emitted when the value is set
    readonly silent?: boolean;
}

export class DataGridState<TValue> {
    private _options: DataGridStateOptions;
    private _events = new EventEmitter();
    private _value: TValue;

    public get value(): TValue {
        return this._value;
    }

    constructor(initialValue: TValue, options: DataGridStateOptions = {}) {
        this._value = initialValue;
        this._options = options;
    }

    public watch(listener: (value: TValue) => void): () => void {
        this._events.on('update_value', listener);

        // Emit the initial value
        this._events.emit('update_value', this.value);

        return () => {
            this._events.off('update_value', listener);
        };
    }

    public set(
        newValue: TValue | ((oldValue: TValue) => TValue),
        options: DataGridStateSetOptions = {}
    ): void {
        const { silent } = options;

        const _newValue = typeof newValue === 'function' ? (newValue as (oldValue: TValue) => TValue)(this.value) : newValue;
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
}
