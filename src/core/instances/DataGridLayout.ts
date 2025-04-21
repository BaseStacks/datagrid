import type { CellId, ColumnLayout, Id, RowData, RectType } from '../types';
import { getCoordinatesById } from '../utils/cellUtils';
import { findIdByRect, findRect, getCursorOffset, getRect } from '../utils/domRectUtils';
import { idTypeEquals } from '../utils/idUtils';
import { DataGridMapState } from './atomic/DataGridMapState';
import { DataGridState } from './atomic/DataGridState';
import { DataGridStates } from './DataGridStates';

export class DataGridLayout<TRow extends RowData> {
    private state: DataGridStates<TRow>;

    private _rectMap: Map<Id, RectType> = new Map();

    private updateRect = (cellId: Id, element: HTMLElement | null) => {
        if (!this.containerState.value || !element) {
            this._rectMap.delete(cellId);
            return;
        }

        const rect = getRect(this.containerState.value, element);
        if (rect) {
            this._rectMap.set(cellId, rect);
        }
    };

    constructor(state: DataGridStates<TRow>) {
        this.state = state;
    }

    public get scrollbarWidth() {
        if (!this.scrollAreaState.value) {
            return 0;
        }

        const scrollArea = this.scrollAreaState.value;
        const scrollWidth = scrollArea.scrollWidth;
        const clientWidth = scrollArea.clientWidth;

        return scrollWidth > clientWidth ? scrollWidth - clientWidth : 0;
    }

    public containerState = new DataGridState<HTMLElement | null>(null);
    public scrollAreaState = new DataGridState<HTMLElement | null>(null);
    public elementsState = new DataGridMapState<Id, HTMLElement>();
    public columnLayoutsState = new DataGridMapState<Id, ColumnLayout>(new Map(), { useDeepEqual: false });

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

    /**
     * Register the container to the layout
     * @param newContainer
     */
    public registerContainer = (newContainer: HTMLElement) => {
        if (!newContainer) {
            return;
        }

        if (this.containerState.value) {
            throw new Error('Container already registered');
        }

        this.containerState.set(newContainer);

        this.elementsState.forEach((element, id) => {
            this.updateRect(id, element);
        });
    };

    /**
     * Remove the container from the layout
     * @param container 
     */
    public removeContainer = (container: HTMLElement) => {
        if (!this.containerState.value) {
            throw new Error('Container not registered');
        }

        if (container !== this.containerState.value) {
            throw new Error('Container mismatch');
        }

        this.containerState.set(null);
    };

    public registerScrollArea = (scrollArea: HTMLElement) => {
        if (!scrollArea) {
            return;
        }

        if (this.scrollAreaState.value) {
            throw new Error('Container already registered');
        }

        this.scrollAreaState.set(scrollArea);
    };

    public removeScrollArea = (scrollArea: HTMLElement) => {
        if (!this.scrollAreaState.value) {
            throw new Error('Container not registered');
        }

        if (scrollArea !== this.scrollAreaState.value) {
            throw new Error('Container mismatch');
        }

        this.scrollAreaState.set(null);
    };

    /**
     * Register the element to the layout
     * @param id
     * @param element
     */
    public registerNode = (id: Id, element: HTMLElement) => {
        this.elementsState.addItem(id, element);

        if (this.containerState.value) {
            this.updateRect(id, element);
        }
    };

    /**
     * Remove the element from the layout
     * @param id 
     */
    public removeElement = (id: Id) => {
        this.elementsState.removeItem(id);
        this._rectMap.delete(id);
        this.updateRect(id, null);
    };

    /**
     * Get the intersection rectangle of the clicked element
     * @param event 
     * @returns 
     */
    public getIntersectionRect = (event: MouseEvent) => {
        if (!this.containerState.value) {
            return null;
        }

        const cursorOffset = getCursorOffset(event, this.containerState.value);
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
    public getRect = (container: HTMLElement ,id: Id) => {
        if (!this.containerState.value) {
            return null;
        }

        const element = this.elementsState.get(id);
        if (!element) {
            return null;
        }

        const rect = getRect(container, element);
        if (rect) {
            return rect;
        }

        return null;
    };

    public getCellByElement = (element: HTMLElement) => {
        const registerCell = this.elementsState.findKey(element);
        if (!registerCell) {
            return null;
        }

        const rect = this._rectMap.get(registerCell);
        if (rect) {
            return {
                id: registerCell as CellId,
                coordinates: getCoordinatesById(registerCell),
                isActive: this.state.activeCell.value?.id === registerCell,
                isFocusing: this.state.editing.value && this.state.activeCell.value?.id === registerCell,
            };
        }

        return null;
    };
};
