import type { CellId, ColumnLayout, HeaderId, Id, RowData } from '../types';
import { getCoordinatesById } from '../utils/cellUtils';
import { findIdByRect, findRect, getCursorOffset, getRect, type RectType } from '../utils/domRectUtils';
import { idTypeEquals } from '../utils/idUtils';
import { DataGridState } from './atomic/DataGridState';
import { DataGridStates } from './DataGridStates';

export class DataGridLayout<TRow extends RowData> {
    private state: DataGridStates<TRow>;

    private _container: HTMLElement | null = null;
    private _elementMap: Map<Id, HTMLElement> = new Map();
    private _rectMap: Map<Id, RectType> = new Map();

    private _defaultColumnWidth = 100;
    private _columnMinWidth = 100;
    private _columnMaxWidth = 500;

    private updateRect = (cellId: Id, element: HTMLElement | null) => {
        if (!element) {
            this._rectMap.delete(cellId);
            return;
        }

        const rect = getRect(this._container!, element);
        if (rect) {
            this._rectMap.set(cellId, rect);
        }
    };

    private updateRects = () => {
        this._elementMap.forEach((element, id) => {
            const rect = getRect(this._container!, element);
            if (rect) {
                this._rectMap.set(id, rect);
            }
        });
    };

    private createColumnLayout = (id: HeaderId) => {
        const existingWidth = this.columns.value.get(id);
        if (existingWidth) {
            throw new Error(`Column width already exists for column ID: ${id}`);
        }

        this.columns.set((prevColumnLayouts) => {
            const newColumnLayouts = new Map(prevColumnLayouts);
            newColumnLayouts.set(id, {
                width: this._defaultColumnWidth,
                left: prevColumnLayouts.values().reduce((acc, layout) => acc + layout.width, 0),
            });
            return newColumnLayouts;
        });
    };

    constructor(state: DataGridStates<TRow>) {
        this.state = state;
        this.columns = new DataGridState<Map<HeaderId, ColumnLayout>>(new Map(), { useDeepEqual: false });
    }

    public columns: DataGridState<Map<HeaderId, ColumnLayout>>;

    public get container() {
        return this._container;
    }

    public get cellRectMap() {
        const cellRectMap = new Map<Id, RectType>();
        this._rectMap.forEach((rect, id) => {
            const idCell = id.startsWith('cell');
            if (idCell) {
                cellRectMap.set(id, rect);
            }
        });

        return cellRectMap;
    }

    public registerContainer = (container: HTMLElement) => {
        if (!container) {
            return;
        }

        if (this._container) {
            throw new Error('Container already registered');
        }

        this._container = container;
        for (const [id, element] of this._elementMap.entries()) {
            this.updateRect(id, element);
        }

        this._container.addEventListener('scroll', this.updateRects);

        // Set default column width based on container width
        const containerWidth = container.clientWidth;
        const columnCount = this.state.headers.value.length;
        const defaultColumnWidth = Math.floor(containerWidth / columnCount);
        this._defaultColumnWidth = Math.max(this._columnMinWidth, Math.min(defaultColumnWidth, this._columnMaxWidth));
    };

    public removeContainer = (container: HTMLElement) => {
        if (!this._container) {
            throw new Error('Container not registered');
        }

        if (container !== this._container) {
            throw new Error('Container mismatch');
        }

        this._container.removeEventListener('scroll', this.updateRects);
        this._container = null;
    };

    public registerElement = (id: Id, element: HTMLElement) => {
        this._elementMap.set(id, element);

        if (this._container) {
            this.updateRect(id, element);
        }

        const isHeader = idTypeEquals(id, 'header');
        if (isHeader) {
            this.createColumnLayout(id as HeaderId);
        }
    };

    public removeElement = (id: Id) => {
        this._elementMap.delete(id);
        this._rectMap.delete(id);
        this.columns.set((prev) => {
            const newColumnLayouts = new Map(prev);
            newColumnLayouts.delete(id as HeaderId);
            return newColumnLayouts;
        });
        this.updateRect(id, null);
    };

    public getIntersectionRect = (event: MouseEvent) => {
        const cursorOffset = getCursorOffset(event, this._container!);
        const clickedRect = findRect(cursorOffset, [...this.cellRectMap.values()]);
        if (!clickedRect) {
            return null;
        }

        const id = findIdByRect(this.cellRectMap, clickedRect)!;

        const isCell = idTypeEquals(id, 'cell');
        if (isCell) {
            const isActiveCell = this.state.activeCell.value?.id === id;
            const isFocusingCell = isActiveCell && this.state.editing.value;

            return {
                rect: clickedRect,
                type: 'cell',
                cell: {
                    id: id as CellId,
                    coordinates: getCoordinatesById(id),
                    isActive: isActiveCell,
                    isFocusing: isFocusingCell,
                }
            };
        }

        return null;
    };

    public getRect = (id: Id) => {
        const cellElement = this._elementMap.get(id);
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
