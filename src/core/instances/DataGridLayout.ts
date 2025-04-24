import type { CellId, ColumnLayout, Id, RowData, RectType, RowLayout, RowId } from '../types';
import { getRect } from '../utils/domRectUtils';
import { extractId } from '../utils/idUtils';
import { DataGridMapState } from './atomic/DataGridMapState';
import { DataGridState } from './atomic/DataGridState';
import { DataGridStates } from './DataGridStates';

export interface DataGridLayoutNode {
    readonly id: Id;
    readonly type: 'header' | 'row' | 'cell',
    readonly element: HTMLElement;
    readonly attributes: Record<string, string>;
    readonly rect?: RectType;
}

export class DataGridLayout<TRow extends RowData> {
    constructor(private state: DataGridStates<TRow>) {
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

    public layoutNodesState = new DataGridMapState<Id, DataGridLayoutNode>(new Map(), { useDeepEqual: false });

    public elementsState = new DataGridMapState<Id, HTMLElement>();
    public columnLayoutsState = new DataGridMapState<Id, ColumnLayout>(new Map(), { useDeepEqual: false });
    public rowLayoutsState = new DataGridMapState<RowId, RowLayout>(new Map(), { useDeepEqual: false });

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

        // this.elementsState.forEach((element, id) => {
        //     this.updateRect(id, element);
        // });
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
        const existingElement = this.elementsState.get(id);

        if (existingElement && existingElement === element) {
            return;
        }

        this.elementsState.addItem(id, element);

        const { type } = extractId(id);
        this.layoutNodesState.addItem(id, {
            id,
            type,
            attributes: {},
            element: element
        });
    };

    /**
     * Remove the element from the layout
     * @param id 
     */
    public removeNode = (id: Id) => {
        this.layoutNodesState.removeItem(id);
        this.elementsState.removeItem(id);
    };

    /**
     * Get the rectangle of the element by id
     * @param id
     */
    public getRect = (container: HTMLElement, id: Id) => {
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

    public getNodeByElement = (element: HTMLElement) => {
        const registeredNode = this.layoutNodesState.values().find((node) => node.element === element);
        return registeredNode;
    };

    public calculateScrollToCell = (targetId: CellId) => {
        const scrollArea = this.scrollAreaState.value;
        if (!scrollArea) {
            throw new Error('Scroll area not found');
        }

        const topPinnedRows = this.rowLayoutsState.values().filter((layout) => layout.pinned === 'top');
        const bottomPinnedRows = this.rowLayoutsState.values().filter((layout) => layout.pinned === 'bottom');
        const leftPinnedColumns = this.columnLayoutsState.values().filter((layout) => layout.pinned === 'left');
        const rightPinnedColumns = this.columnLayoutsState.values().filter((layout) => layout.pinned === 'right');

        const topHeight = topPinnedRows.reduce((acc, layout) => acc + layout.height, 0);
        const bottomWidth = bottomPinnedRows.reduce((acc, layout) => acc + layout.height, 0);

        const leftWidth = leftPinnedColumns.reduce((acc, layout) => acc + layout.width, 0);
        const rightWidth = rightPinnedColumns.reduce((acc, layout) => acc + layout.width, 0);

        const centerWidth = scrollArea.clientWidth - leftWidth - rightWidth;
        const centerRect: RectType = {
            left: leftWidth,
            top: topHeight,
            right: leftWidth + centerWidth,
            bottom: scrollArea.clientHeight - bottomWidth,
            width: centerWidth,
            height: scrollArea.clientHeight,
        };

        const activeRect = this.getRect(scrollArea, targetId);

        if (!activeRect) {
            throw new Error('Active cell rect not found');
        }

        let nextScrollLeft: undefined | number;
        let nextScrollTop: undefined | number;

        const needScrollVertical = activeRect.top < centerRect.top || activeRect.bottom > centerRect.bottom;
        if (needScrollVertical) {
            const scrollTop = scrollArea.scrollTop;
            const scrollHeight = scrollArea.scrollHeight;
            const clientHeight = scrollArea.clientHeight;
            const scrollableHeight = scrollHeight - clientHeight;
            const scrollTopDelta = activeRect.top - centerRect.top;

            const isTopIntersecting = activeRect.top < centerRect.top;
            const needScrollTop = isTopIntersecting && scrollTopDelta < 0;
            if (needScrollTop) {
                const newScrollTop = scrollTop + scrollTopDelta;
                nextScrollTop = Math.max(0, Math.min(newScrollTop, scrollableHeight));
            }

            const scrollBottomDelta = activeRect.bottom - centerRect.bottom;
            const isBottomIntersecting = activeRect.bottom > centerRect.bottom;
            const needScrollBottom = isBottomIntersecting && scrollBottomDelta > 0;
            if (needScrollBottom) {
                const newScrollTop = scrollTop + scrollBottomDelta;
                nextScrollTop = Math.max(0, Math.min(newScrollTop, scrollableHeight));
            }
        }

        const needScrollHorizontal = activeRect.left < centerRect.left || activeRect.right > centerRect.right;
        if (needScrollHorizontal) {

            const scrollLeft = scrollArea.scrollLeft;
            const scrollWidth = scrollArea.scrollWidth;
            const clientWidth = scrollArea.clientWidth;
            const scrollableWidth = scrollWidth - clientWidth;
            const scrollLeftDelta = activeRect.left - centerRect.left;

            const isLeftIntersecting = activeRect.left < centerRect.left;
            const needScrollLeft = isLeftIntersecting && scrollLeftDelta < 0;
            if (needScrollLeft) {
                const newScrollLeft = scrollLeft + scrollLeftDelta;
                nextScrollLeft = Math.max(0, Math.min(newScrollLeft, scrollableWidth));
            }

            const scrollRightDelta = activeRect.right - centerRect.right;
            const isRightIntersecting = activeRect.right > centerRect.right;
            const needScrollRight = isRightIntersecting && scrollRightDelta > 0;
            if (needScrollRight) {
                const newScrollLeft = scrollLeft + scrollRightDelta;
                nextScrollLeft = Math.max(0, Math.min(newScrollLeft, scrollableWidth));
            }
        }
        return {
            left: nextScrollLeft,
            top: nextScrollTop,
        };
    };
};
