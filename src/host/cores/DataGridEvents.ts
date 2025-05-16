import { EventEmitter } from '../atomic/EventEmitter';

export class DataGridEvents {
    private _eventEmitter = new EventEmitter();

    constructor() {
    }

    public emit = (event: string, data: any) => {
        this._eventEmitter.emit(event, data);
    };

    public addListener = (event: string, listener: (data: any) => void) => {
        this._eventEmitter.on(event, listener);
        return () => {
            this._eventEmitter.off(event, listener);
        };
    };

    public removeListener = (event: string, listener: (event: any) => void) => {
        this._eventEmitter.off(event, listener);
    };
};
