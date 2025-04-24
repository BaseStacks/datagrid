import { DataGridPlugin } from '../instances/atomic/DataGridPlugin';
import type { HeaderId, ColumnKey, ColumnLayout } from '../types';

export interface ColumnPinningPluginOptions {
    readonly pinnedLeftColumns?: ColumnKey[];
    readonly pinnedBottomColumns?: ColumnKey[];
}

export class ColumnPinningPlugin extends DataGridPlugin<ColumnPinningPluginOptions> {
    private _lastScrollLeft: number = 0;

    private createColumnLayouts = () => {
        const { headers } = this.dataGrid.state;

        // Set default column width based on scrollArea width
        const scrollAreaWidth = this.scrollArea.clientWidth;
        const columnCount = headers.value.length;
        const defaultColumnWidth = Math.floor(scrollAreaWidth / columnCount);
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

    private updateColumnLayouts = (trigger?: 'scroll-left') => {
        const { columnLayoutsState } = this.dataGrid.layout;

        const viewportWidth = this.scrollArea.clientWidth;
        const baseLeft = this.scrollArea.scrollLeft;
        const baseRight = this.scrollArea.scrollWidth - viewportWidth - baseLeft;

        const columnsNeedUpdate = columnLayoutsState.values().filter((columnLayout) => {
            if (trigger === 'scroll-left') {
                return columnLayout.header.column.pinned === 'left' || columnLayout.header.column.pinned === 'right';
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
        const isScrollingLeft = this.scrollArea.scrollLeft != this._lastScrollLeft;
        if (!isScrollingLeft) {
            return;
        }

        this._lastScrollLeft = this.scrollArea.scrollLeft;
        this.updateColumnLayouts('scroll-left');
    };

    private handleContainerResize = () => {
        this.updateColumnLayouts();
    };

    public handleActivate = () => {
        this.scrollArea.addEventListener('scroll', this.handleContainerScroll);
        this.unsubscribes.push(() => {
            this.scrollArea.removeEventListener('scroll', this.handleContainerScroll);
        });

        this.dataGrid.state.headers.watch(() => {
            this.createColumnLayouts();
            this.updateColumnLayouts();
        });

        const resizeObserver = new ResizeObserver(this.handleContainerResize);
        resizeObserver.observe(this.scrollArea);
        this.unsubscribes.push(() => {
            resizeObserver.disconnect();
        });
    };
}
