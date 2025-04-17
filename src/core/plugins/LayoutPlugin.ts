import type { DataGrid } from '../instances/DataGrid';
import type { RowData, DataGridPlugin, ColumnLayout } from '../types';

export interface LayoutPluginOptions {
}

export class LayoutPlugin<TRow extends RowData = RowData> implements DataGridPlugin<LayoutPluginOptions> {
    private readonly dataGrid: DataGrid<TRow>;

    private updateColumnLayouts = () => {
        const { container, columns } = this.dataGrid.layout;
        const scrollLeft = container!.scrollLeft;

        columns.set((prevColumnLayouts) => {
            const newColumnLayouts = new Map();

            const leftPinnedColumns: ColumnLayout[] = [];
            const rightPinnedColumns: ColumnLayout[] = [];

            prevColumnLayouts.forEach((layout, id) => {
                const header = layout.header;
                const pinned = header.column.pinned;

                if (pinned === 'left') {
                    leftPinnedColumns.push(layout);
                } else if (pinned === 'right') {
                    rightPinnedColumns.push(layout);
                }

                const left = pinned === 'left'
                    ? scrollLeft + leftPinnedColumns.reduce((acc, layout) => acc + layout.width, 0)
                    : pinned === 'right'
                        ? container!.clientWidth - rightPinnedColumns.reduce((acc, layout) => acc + layout.width, 0)
                        : prevColumnLayouts.get(id)?.left || 0;

                newColumnLayouts.set(id, {
                    ...layout,
                    left,
                });
            });
            return newColumnLayouts;
        });
    };

    private handleContainerScroll = () => {
        this.dataGrid.layout.updateRects();
        this.updateColumnLayouts();
    };

    constructor(dataGrid: DataGrid<TRow>) {
        this.dataGrid = dataGrid;
    }

    public active: boolean = false;

    public activate = (_opts: LayoutPluginOptions) => {
        this.active = true;

        this.dataGrid.layout.container!.addEventListener('scroll', this.handleContainerScroll);
    };

    public deactivate = () => {
        this.active = false;
        this.dataGrid.layout.container!.removeEventListener('scroll', this.handleContainerScroll);
    };
}
