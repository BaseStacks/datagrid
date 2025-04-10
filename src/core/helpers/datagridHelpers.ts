export type EventEmitterCallback<T = any> = (value: T) => void;

export class EventEmitter {
    readonly callbacks: { [key: string]: EventEmitterCallback[] };

    constructor() {
        this.callbacks = {};
    }

    public on(event: string, cb: EventEmitterCallback) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(cb);
        return () => {
            this.callbacks[event] = this.callbacks[event].filter((callback) => callback !== cb);
        };
    }

    public emit(event: string, data: unknown) {
        const cbs = this.callbacks[event];
        if (cbs) {
            cbs.forEach(cb => cb(data));
        }
    }
}

type DataGridStateSetter<T> = (value: T | ((oldValue: T) => T)) => void;

export type DataGridState<T> = {
    value: T;
    set: DataGridStateSetter<T>;
    watch: (listener: EventEmitterCallback<T>) => () => void;
}

type DataGridStateWithEvents<T> = DataGridState<T> & {
    events: EventEmitter;
}

export const createDataGridState = <T>(defaultValue: T): DataGridState<T> => ({
    events: new EventEmitter(),
    value: defaultValue,
    watch: function (listener) {
        return this.events.on('update_value', listener);
    },
    set(nextValue: ((oldValue: T) => T) | T) {
        this.value = typeof nextValue === 'function' ? (nextValue as (oldValue: T) => T)(this.value) : nextValue;
        this.events.emit('update_value', this.value);
    }
} as DataGridStateWithEvents<T>);
