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
    private _columnMinWidth = 200;
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

    private createColumnLayout = (id: HeaderId) => {
        const existingWidth = this.columns.value.get(id);
        if (existingWidth) {
            throw new Error(`Column width already exists for column ID: ${id}`);
        }

        const header = this.state.headers.value.find((header) => header.id === id);
        if (!header) {
            throw new Error(`Header not found for column ID: ${id}`);
        }

        this.columns.set((prevColumnLayouts) => {
            const newColumnLayouts = new Map(prevColumnLayouts);
            const pinned = header.column.pinned;

            const pinnedColumns = prevColumnLayouts.values()
                .filter((layout) => layout.header.column.pinned === pinned);

            const left = pinned === 'left'
                ? pinnedColumns.reduce((acc, layout) => acc + layout.width, 0)
                : pinned === 'right'
                    ? this._container.clientWidth - this._defaultColumnWidth
                    : prevColumnLayouts.values().reduce((acc, layout) => acc + layout.width, 0);

            newColumnLayouts.set(id, {
                header,
                width: this._defaultColumnWidth,
                left: left,
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

    public updateRects = () => {
        this._elementMap.forEach((element, id) => {
            const rect = getRect(this._container!, element);
            if (rect) {
                this._rectMap.set(id, rect);
            }
        });
    };

    /**
     * Register the container to the layout
     * @param container
     */
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

        // Set default column width based on container width
        const containerWidth = container.clientWidth;
        const columnCount = this.state.headers.value.length;
        const defaultColumnWidth = Math.floor(containerWidth / columnCount);
        this._defaultColumnWidth = Math.max(this._columnMinWidth, Math.min(defaultColumnWidth, this._columnMaxWidth));
    };

    /**
     * Remove the container from the layout
     * @param container 
     */
    public removeContainer = (container: HTMLElement) => {
        if (!this._container) {
            throw new Error('Container not registered');
        }

        if (container !== this._container) {
            throw new Error('Container mismatch');
        }

        this._container = null;
    };

    /**
     * Register the element to the layout
     * @param id
     * @param element
     */
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

    /**
     * Remove the element from the layout
     * @param id 
     */
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

    /**
     * Get the intersection rectangle of the clicked element
     * @param event 
     * @returns 
     */
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

    /**
     * Get the rectangle of the element by id
     * @param id
     */
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
