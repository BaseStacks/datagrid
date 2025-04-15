import type { Id, RowData } from '../types';
import { getCoordinatesById } from '../utils/cellUtils';
import { findCellByRect, findRect, getCursorOffset, getRect, type RectType } from '../utils/domRectUtils';
import type { DataGridStates } from './DataGridStates';

export class DataGridLayout<TRow extends RowData> {
    private state: DataGridStates<TRow>;

    private _container: HTMLElement | null = null;
    private _cellMap: Map<Id, HTMLElement> = new Map();
    private _cellRectMap: Map<Id, RectType> = new Map();

    constructor(state: DataGridStates<TRow>) {
        this.state = state;
    }

    private updateCellRect = (cellId: Id, element: HTMLElement | null) => {
        if (!element) {
            this._cellRectMap.delete(cellId);
            return;
        }

        const rect = getRect(this._container!, element);
        if (rect) {
            this._cellRectMap.set(cellId, rect);
        }
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

    public registerCell = (cellId: Id, element: HTMLElement) => {
        this._cellMap.set(cellId, element);
        this.updateCellRect(cellId, element);
    };

    public removeCell = (cellId: Id) => {
        this._cellMap.delete(cellId);
        this.updateCellRect(cellId, null);
    };

    public getIntersectionRect = (event: MouseEvent) => {
        const cursorOffset = getCursorOffset(event, this._container!);
        const clickedRect = findRect(cursorOffset, [...this.cellRectMap.values()]);
        if(!clickedRect) {
            return null;
        }

        const cellId = findCellByRect(this.cellRectMap, clickedRect)!;
        const isActiveCell = this.state.activeCell.value?.id === cellId;
        const isFocusingCell = isActiveCell && this.state.editing.value;

        return {
            rect: clickedRect,
            type: 'cell',
            cell: {
                id: cellId,
                coordinates: getCoordinatesById(cellId),
                isActive: isActiveCell,
                isFocusing: isFocusingCell,
            }
        };
    };

    public getRect = (cellId: Id) => {
        const cellElement = this._cellMap.get(cellId);
        if (!cellElement) {
            return null;
        }

        const rect = getRect(this._container!, cellElement);
        if (rect) {
            return rect;
        }

        return null;
    };
};
