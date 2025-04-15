import type { RowData } from '../types';
import { findCoordByRect, findRect, getCursorOffset, getRect, type RectType } from '../utils/domRectUtils';
import type { DataGridStates } from './DataGridStates';

export class DataGridLayout<TRow extends RowData> {
    private state: DataGridStates<TRow>;

    private _container: HTMLElement | null = null;
    private _cellMap: Map<string, HTMLElement> = new Map();
    private _cellRectMap: Map<string, RectType> = new Map();

    constructor(state: DataGridStates<TRow>) {
        this.state = state;
    }

    private updateCellRect = (cellId: string, element: HTMLElement | null) => {
        if(!element) {
            this._cellRectMap.delete(cellId);
            return;
        }

        const rect = getRect(this._container!, element);
        if (rect) {
            this._cellRectMap.set(cellId, rect);
        }
    };

    private calculateCellRects = () => {
        this._cellMap.forEach((element, cellId) => {
            this.updateCellRect(cellId, element);
        });
    };

    public get container() {
        return this._container;
    }

    public get cellRectMap() {
        return this._cellRectMap;
    }

    public registerContainer = (container: HTMLElement) => {
        this._container = container;
    };

    public registerCell = (cellId: string, element: HTMLElement) => {
        this._cellMap.set(cellId, element);
    };

    public removeCell = (cellId: string) => {
        this._cellMap.delete(cellId);
    };

    public getEventData = (event: MouseEvent) => {
        const cursorOffset = getCursorOffset(event, this._container!);
        const clickedRect = findRect(cursorOffset, [...this.cellRectMap.values()]);
        const clickedCell = clickedRect ? findCoordByRect(this.cellRectMap, clickedRect) : null;

        return {
            clickedCell,
            clickedRect,
            cursorOffset,
        };
    };
};
