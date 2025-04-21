import type { DataGrid } from '../instances/DataGrid';
import type { RowData, DataGridPlugin, ColumnLayout, HeaderId, RectType } from '../types';

export interface LayoutPluginOptions {
}

export class LayoutPlugin<TRow extends RowData = RowData> implements DataGridPlugin<LayoutPluginOptions> {
    private readonly dataGrid: DataGrid<TRow>;

    private get container() {
        return this.dataGrid.layout.containerState.value!;
    }

    private get scrollArea() {
        return this.dataGrid.layout.scrollAreaState.value!;
    }

    private _lastScrollTop: number = 0;
    private _resizeObserver: ResizeObserver | null = null;
    private _unsubscribes: (() => void)[] = [];

    private createColumnLayouts = () => {
        const { headers } = this.dataGrid.state;

        // Set default column width based on container width
        const containerWidth = this.container.clientWidth;
        const columnCount = headers.value.length;
        const defaultColumnWidth = Math.floor(containerWidth / columnCount);
        const columnWidth = Math.max(this.dataGrid.options.columnMinWidth, Math.min(defaultColumnWidth, this.dataGrid.options.columnMaxWidth));

        const columnLayouts = new Map<HeaderId, ColumnLayout>();
        const leftPinnedColumnsCount = headers.value.filter((header) => header.column.pinned === 'left').length;
        const rightPinnedColumnsCount = headers.value.filter((header) => header.column.pinned === 'right').length;

        headers.value.forEach((header, index) => {
            const columnId = header.id;

            const layout: ColumnLayout = {
                index: index,
                header,
                width: columnWidth,
                firstLeftPinned: header.column.pinned === 'left' && index === 0,
                lastLeftPinned: header.column.pinned === 'left' && index === leftPinnedColumnsCount - 1,
                firstRightPinned: header.column.pinned === 'right' && index === headers.value.length - rightPinnedColumnsCount,
                lastRightPinned: header.column.pinned === 'right' && index === headers.value.length - 1,
                left: undefined,
                right: undefined,
            };


            columnLayouts.set(columnId, layout);
        });

        this.dataGrid.layout.columnLayoutsState.set(columnLayouts);
    };

    private updateColumnLayouts = (trigger?: 'scroll-down' | 'scroll-left') => {
        const { columnLayoutsState } = this.dataGrid.layout;

        const viewportWidth = this.scrollArea.clientWidth;
        const baseLeft = this.scrollArea.scrollLeft;
        const baseRight = this.scrollArea.scrollWidth - viewportWidth - baseLeft;

        const columnsNeedUpdate = columnLayoutsState.values().filter((columnLayout) => {
            if (trigger === 'scroll-left') {
                return columnLayout.header.column.pinned === 'left' || columnLayout.header.column.pinned === 'right';
            }

            if (trigger === 'scroll-down') {
                return false;
            }

            return true;
        });

        let calculatedLeft = baseLeft;
        let calculatedBodyLeft = baseLeft;
        let calculatedRight = baseRight;

        columnsNeedUpdate.forEach((layout) => {
            const header = layout.header;
            const pinned = header.column.pinned;

            let left: number | undefined = undefined;
            let right: number | undefined = undefined;

            if (pinned === 'left') {
                left = calculatedLeft;
                calculatedLeft += layout.width;
                calculatedBodyLeft += layout.width;
            }
            else if (pinned === 'right') {
                right = calculatedRight;
                calculatedRight -= layout.width;
            }
            else {
                left = calculatedBodyLeft;
                calculatedBodyLeft += layout.width;
            }

            const needUpdate = (layout.left !== left || layout.right !== right);
            if (!needUpdate) {
                return;
            }

            columnLayoutsState.replaceItem(header.id, { ...layout, left, right });
        });
    };

    private handleContainerScroll = () => {
        // this.dataGrid.layout.updateRects();
        const isScrollingDown = this.container.scrollTop != this._lastScrollTop;
        this._lastScrollTop = this.container.scrollTop;
        this.updateColumnLayouts(isScrollingDown ? 'scroll-down' : 'scroll-left');
    };

    private handleActiveChange = (activeDirection: 'left' | 'top' | 'right' | 'bottom') => {
        const leftPinnedColumns = this.dataGrid.layout.columnLayoutsState.values().filter((layout) => layout.header.column.pinned === 'left');
        const rightPinnedColumns = this.dataGrid.layout.columnLayoutsState.values().filter((layout) => layout.header.column.pinned === 'right');

        const leftColumnsWidth = leftPinnedColumns.reduce((acc, layout) => acc + layout.width, 0);
        const rightColumnsWidth = rightPinnedColumns.reduce((acc, layout) => acc + layout.width, 0);

        const centerViewport = this.scrollArea.clientWidth - leftColumnsWidth - rightColumnsWidth;
        const centerRect: RectType = {
            left: leftColumnsWidth,
            top: 0,
            right: leftColumnsWidth + centerViewport,
            bottom: this.scrollArea.clientHeight,
            width: centerViewport,
            height: this.scrollArea.clientHeight,
        };

        const activeRect = this.dataGrid.layout.getRect(
            this.dataGrid.layout.scrollAreaState.value!,
            this.dataGrid.state.activeCell.value!.id
        );

        if (!activeRect) {
            throw new Error('Active cell rect not found');
        }


        const scrollBehavior: ScrollBehavior = 'instant';

        if (activeDirection === 'top' || activeDirection === 'bottom') {
            const needScroll = activeRect.top < centerRect.top || activeRect.bottom > centerRect.bottom;
            if (!needScroll) {
                return;
            }

            const scrollTop = this.scrollArea.scrollTop;
            const scrollHeight = this.scrollArea.scrollHeight;
            const clientHeight = this.scrollArea.clientHeight;
            const scrollableHeight = scrollHeight - clientHeight;
            const scrollTopDelta = activeRect.top - centerRect.top;
            const scrollBottomDelta = activeRect.bottom - centerRect.bottom;

            if (activeDirection === 'top') {
                const isTopIntersecting = activeRect.top < centerRect.top;
                const needScrollTop = scrollTopDelta < 0;

                if (!isTopIntersecting || !needScrollTop) {
                    return;
                }

                const newScrollTop = scrollTop + scrollTopDelta;
                this.scrollArea.scrollTo({
                    top: Math.max(0, Math.min(newScrollTop, scrollableHeight)),
                    behavior: scrollBehavior,
                });
            }
            else if (activeDirection === 'bottom') {
                const isBottomIntersecting = activeRect.bottom > centerRect.bottom;
                const needScrollBottom = scrollBottomDelta > 0;
                if (!isBottomIntersecting || !needScrollBottom) {
                    return;
                }

                const newScrollTop = scrollTop + scrollBottomDelta;

                this.scrollArea.scrollTo({
                    top: Math.max(0, Math.min(newScrollTop, scrollableHeight)),
                    behavior: scrollBehavior,
                });
            }

            return;
        }

        const isActiveCellInViewport = activeRect.left >= centerRect.left && activeRect.right <= centerRect.right;
        if (isActiveCellInViewport) {
            return;
        }

        const scrollLeft = this.scrollArea.scrollLeft;
        const scrollWidth = this.scrollArea.scrollWidth;
        const clientWidth = this.scrollArea.clientWidth;
        const scrollableWidth = scrollWidth - clientWidth;
        const scrollLeftDelta = activeRect.left - centerRect.left;
        const scrollRightDelta = activeRect.right - centerRect.right;

        if (activeDirection === 'left') {
            const isLeftIntersecting = activeRect.left < centerRect.left;
            const needScrollLeft = scrollLeftDelta < 0;
            if (!isLeftIntersecting || !needScrollLeft) {
                return;
            }

            const newScrollLeft = scrollLeft + scrollLeftDelta;

            this.scrollArea.scrollTo({
                left: Math.max(0, Math.min(newScrollLeft, scrollableWidth)),
                behavior: scrollBehavior,
            });
        }
        else if (activeDirection === 'right') {
            const isRightIntersecting = activeRect.right > centerRect.right;
            const needScrollRight = scrollRightDelta > 0;
            if (!isRightIntersecting || !needScrollRight) {
                return;
            }

            const newScrollLeft = scrollLeft + scrollRightDelta;

            this.scrollArea.scrollTo({
                left: Math.max(0, Math.min(newScrollLeft, scrollableWidth)),
                behavior: scrollBehavior,
            });
        }
    };

    private handleContainerResize = () => {
        // this.dataGrid.layout.updateRects();
        this.updateColumnLayouts();
    };

    private doActivate = () => {
        this.active = true;

        this.createColumnLayouts();
        this.updateColumnLayouts();

        this.scrollArea.addEventListener('scroll', this.handleContainerScroll);

        const resizeObserver = new ResizeObserver(() => {
            this.handleContainerResize();
        });

        resizeObserver.observe(this.container);

        const actionExecListener = this.dataGrid.events.addListener('execute-action', ({ action }) => {
            if (action === 'activeLeft' || action === 'jumpLeft') {
                this.handleActiveChange('left');
            }
            else if (action === 'activeRight' || action === 'jumpRight') {
                this.handleActiveChange('right');
            }
            else if (action === 'activeUpper' || action === 'jumpTop') {
                this.handleActiveChange('top');
            }
            else if (action === 'activeLower' || action === 'jumpBottom') {
                this.handleActiveChange('bottom');
            }
        });

        this._unsubscribes.push(actionExecListener);
    };

    constructor(dataGrid: DataGrid<TRow>) {
        this.dataGrid = dataGrid;
    }

    public active: boolean = false;

    public activate = (_opts: LayoutPluginOptions) => {
        this.dataGrid.layout.containerState.watch((container) => {
            if (this.active) {
                this.deactivate();
            }

            if (!container) {
                return;
            }

            this.doActivate();
        });
    };

    public deactivate = () => {
        if (!this.active || !this.container) {
            return;
        }

        this.scrollArea?.removeEventListener('scroll', this.handleContainerScroll);

        this._resizeObserver?.disconnect();
        this._resizeObserver = null;

        this._unsubscribes.forEach(unsubscribe => unsubscribe());
        this._unsubscribes = [];
    };
}
