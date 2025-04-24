import { DataGridPlugin } from '../instances/atomic/DataGridPlugin';
import type { HeaderId, ColumnKey, ColumnLayout, ColumnHeader } from '../types';

export interface ColumnPinningPluginOptions {
    readonly pinnedLeftColumns?: ColumnKey[];
    readonly pinnedRightColumns?: ColumnKey[];
}

export class ColumnPinningPlugin extends DataGridPlugin<ColumnPinningPluginOptions> {
    private _lastScrollLeft: number = 0;

    private _leftHeaders: ColumnHeader[] = [];
    private _bodyHeaders: ColumnHeader[] = [];
    private _rightHeaders: ColumnHeader[] = [];
    private _rightHeadersDesc: ColumnHeader[] = [];

    private createColumnLayouts = () => {
        const { headers } = this.dataGrid.state;

        // Set default column width based on scrollArea width
        const scrollAreaWidth = this.scrollArea.clientWidth;
        const columnCount = headers.value.length;
        const defaultColumnWidth = Math.floor(scrollAreaWidth / columnCount);
        const columnWidth = Math.max(this.dataGrid.options.columnMinWidth, Math.min(defaultColumnWidth, this.dataGrid.options.columnMaxWidth));

        const columnLayouts = new Map<HeaderId, ColumnLayout>();

        this._leftHeaders.forEach((header, index, leftHeaders) => {
            const layout: ColumnLayout = {
                index,
                header,
                width: columnWidth,
                pinned: 'left',
                firstLeftPinned: index === 0,
                lastLeftPinned: index === leftHeaders.length - 1,
            };

            columnLayouts.set(header.id, layout);
        });

        this._bodyHeaders.forEach((header, index) => {
            const columnId = header.id;

            const layout: ColumnLayout = {
                index,
                header,
                width: columnWidth,
                left: (index + this._leftHeaders.length) * columnWidth
            };

            columnLayouts.set(columnId, layout);
        });

        this._rightHeaders.forEach((header, index, rightHeaders) => {
            const columnId = header.id;

            const layout: ColumnLayout = {
                index,
                header,
                width: columnWidth,
                pinned: 'right',
                firstRightPinned: index == 0,
                lastRightPinned: index === rightHeaders.length - 1
            };

            columnLayouts.set(columnId, layout);
        });

        this.dataGrid.layout.columnLayoutsState.set(columnLayouts);
    };

    private updateColumnLayouts = () => {
        const { columnLayoutsState } = this.dataGrid.layout;

        const viewportWidth = this.scrollArea.clientWidth;
        const baseLeft = this.scrollArea.scrollLeft;
        const baseRight = this.scrollArea.scrollWidth - viewportWidth - baseLeft;

        let calculatedLeft = baseLeft;
        let calculatedRight = baseRight;

        this._leftHeaders.forEach((header) => {
            const layout = this.dataGrid.layout.columnLayoutsState.get(header.id);
            if (!layout) {
                throw new Error('Column layout not found');
            }

            const left = calculatedLeft;
            calculatedLeft += layout.width;

            const needUpdate = layout.left !== left;
            if (!needUpdate) {
                return;
            }

            columnLayoutsState.replaceItem(header.id, { ...layout, left });
        });

        this._rightHeadersDesc.forEach((header) => {
            const layout = this.dataGrid.layout.columnLayoutsState.get(header.id);
            if (!layout) {
                throw new Error('Column layout not found');
            }

            const right = calculatedRight;
            calculatedRight += layout.width;

            const needUpdate = layout.right !== right;
            if (!needUpdate) {
                return;
            }

            columnLayoutsState.replaceItem(header.id, { ...layout, right });
        });
    };

    private handleContainerScroll = () => {
        const isScrollingLeft = this.scrollArea.scrollLeft != this._lastScrollLeft;
        if (!isScrollingLeft) {
            return;
        }

        this._lastScrollLeft = this.scrollArea.scrollLeft;
        this.updateColumnLayouts();
    };

    public handleActivate = () => {
        this.scrollArea.addEventListener('scroll', this.handleContainerScroll);
        this.unsubscribes.push(() => {
            this.scrollArea.removeEventListener('scroll', this.handleContainerScroll);
        });

        const watchHeaders = this.dataGrid.state.headers.watch((newHeaders) => {
            const { pinnedRightColumns, pinnedLeftColumns } = this.options;

            this._leftHeaders = pinnedLeftColumns ? newHeaders.filter((header) => pinnedLeftColumns.includes(header.column.dataKey)) : [];
            this._rightHeaders = pinnedRightColumns ? newHeaders.filter((header) => pinnedRightColumns.includes(header.column.dataKey)) : [];
            this._bodyHeaders = newHeaders.filter(header => !this._leftHeaders.includes(header) && !this._rightHeaders.includes(header));
            this._rightHeadersDesc = [...this._rightHeaders].reverse();
            
            this.createColumnLayouts();
            this.updateColumnLayouts();
        });
        this.unsubscribes.push(watchHeaders);

        const resizeObserver = new ResizeObserver(() => {
            this.updateColumnLayouts();
        });
        resizeObserver.observe(this.scrollArea);
        this.unsubscribes.push(() => {
            resizeObserver.disconnect();
        });
    };
}
