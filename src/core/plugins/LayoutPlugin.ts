import type { DataGrid } from '../instances/DataGrid';
import type { RowData, DataGridPlugin, ColumnLayout, HeaderId } from '../types';

export interface LayoutPluginOptions {
}

export class LayoutPlugin<TRow extends RowData = RowData> implements DataGridPlugin<LayoutPluginOptions> {
    private readonly dataGrid: DataGrid<TRow>;

    private _lastScrollTop: number = 0;

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
                right: undefined
            };

            columnLayouts.set(columnId, layout);
        });

        this.dataGrid.layout.columnLayoutsState.set(columnLayouts);
    };

    private updateColumnLayouts = (trigger?: 'scroll-down' | 'scroll-left') => {
        const { columnLayoutsState } = this.dataGrid.layout;

        const viewportWidth = this.container.clientWidth;
        const baseLeft = this.container.scrollLeft;
        const baseRight = this.container.scrollWidth - viewportWidth - baseLeft;

        const columnsNeedUpdate = columnLayoutsState.values().filter((columnLayout) => {
            if (trigger === 'scroll-left') {
                return columnLayout.header.column.pinned === 'left' || columnLayout.header.column.pinned === 'right';
            }

            return columnLayout;
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
        this.dataGrid.layout.updateRects();
        const isScrollingDown = this.container.scrollTop != this._lastScrollTop;
        this._lastScrollTop = this.container.scrollTop;
        this.updateColumnLayouts(isScrollingDown ? 'scroll-down' : 'scroll-left');
    };

    private doActivate = () => {
        this.active = true;

        this.createColumnLayouts();
        this.updateColumnLayouts();

        this.container.addEventListener('scroll', this.handleContainerScroll);
    };

    private get container() {
        return this.dataGrid.layout.containerState.value!;
    }

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

        this.container?.removeEventListener('scroll', this.handleContainerScroll);
    };
}
