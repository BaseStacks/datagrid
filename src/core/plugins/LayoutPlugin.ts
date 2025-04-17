import type { DataGrid } from '../instances/DataGrid';
import type { RowData, DataGridPlugin, ColumnLayout, HeaderId } from '../types';

export interface LayoutPluginOptions {
}

export class LayoutPlugin<TRow extends RowData = RowData> implements DataGridPlugin<LayoutPluginOptions> {
    private readonly dataGrid: DataGrid<TRow>;

    private calculateLeft = (columnLayouts: ColumnLayout[], current: ColumnLayout) => {
        const currentIndex = columnLayouts.findIndex((column) => column === current);

        const prevColumns = columnLayouts.slice(0, currentIndex);
        const prevWidth = prevColumns.reduce((acc, column) => acc + column.width, 0);

        return prevWidth;
    };

    private calculateRight = (columnLayouts: ColumnLayout[], current: ColumnLayout) => {
        const currentIndex = columnLayouts.findIndex((column) => column === current);

        const nextColumns = columnLayouts.slice(currentIndex + 1);
        const nextWidth = nextColumns.reduce((acc, column) => acc + column.width, 0);

        return nextWidth;
    };

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

    public updateColumnLayouts = () => {
        const { columnLayoutsState } = this.dataGrid.layout;

        const viewportWidth = this.container.clientWidth;
        const baseLeft = this.container.scrollLeft;
        const baseRight = this.container.scrollWidth - viewportWidth - baseLeft;

        const leftPinnedColumns = Array.from(columnLayoutsState.values().filter((columnLayout) => columnLayout.header.column.pinned === 'left'));
        const rightPinnedColumns = Array.from(columnLayoutsState.values().filter((columnLayout) => columnLayout.header.column.pinned === 'right'));

        columnLayoutsState.forEach((layout) => {
            const header = layout.header;
            const pinned = header.column.pinned;

            let left: number | undefined = undefined;
            let right: number | undefined = undefined;

            if (pinned === 'left') {
                left = baseLeft + this.calculateLeft(leftPinnedColumns, layout);
            }
            else if (pinned === 'right') {
                right = baseRight + this.calculateRight(rightPinnedColumns, layout);
            }
            else {
                const prevColumns = Array.from(columnLayoutsState.values()).filter((column) => column.index < layout.index);
                left = prevColumns.reduce((acc, column) => acc + column.width, 0);
            }

            columnLayoutsState.replaceItem(header.id, {
                ...layout,
                left: left,
                right: right
            });
        });
    };

    private handleContainerScroll = () => {
        this.dataGrid.layout.updateRects();
        this.updateColumnLayouts();
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
