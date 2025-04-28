import type { DataGridEventType, DataGridEventTypes, RowData } from '../types';
import type { DataGridStates } from './DataGridStates';

import { EventEmitter } from '../atomic/EventEmitter';

export class DataGridEvents<TRow extends RowData> {
    private _eventEmitter = new EventEmitter();

    constructor(_state: DataGridStates<TRow>) {
    }

    public emit = <TEvent extends DataGridEventType>(event: TEvent, data: DataGridEventTypes[TEvent]) => {
        this._eventEmitter.emit(event, data);
    };

    public addListener = <TEvent extends DataGridEventType>(event: TEvent, listener: (data: DataGridEventTypes[TEvent]) => void) => {
        this._eventEmitter.on(event, listener);
        return () => {
            this._eventEmitter.off(event, listener);
        };
    };

    public removeListener = <TEvent extends DataGridEventType>(event: TEvent, listener: (event: DataGridEventTypes[TEvent]) => void) => {
        this._eventEmitter.off(event, listener);
    };
};
