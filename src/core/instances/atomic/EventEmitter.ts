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
