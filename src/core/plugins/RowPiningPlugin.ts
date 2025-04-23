import { DataGridPlugin } from '../instances/atomic/DataGridPlugin';
import type { Row, RowId, RowKey, RowLayout } from '../types';

export interface RowPiningPluginOptions {
    readonly pinnedTopRows?: RowKey[];
    readonly pinnedBottomRows?: RowKey[];
}

export class RowPiningPlugin extends DataGridPlugin<RowPiningPluginOptions> {
    private lastScrollTop = 0;

    private _topRows: Row[] = [];
    private _bodyRows: Row[] = [];
    private _bottomRows: Row[] = [];

    private createRowLayouts = () => {
        const rowLayoutMap = new Map<RowId, RowLayout>();
        this._topRows?.forEach((row, index, topRows) => {
            const rowId = row.id as RowId;
            const layout: RowLayout = {
                index: index,
                row,
                height: this.dataGrid.options.rowHeight,
                top: index * this.dataGrid.options.rowHeight,
                pinned: 'top',
                firstPinnedTop: (index === 0) && true || undefined,
                lastPinnedTop: (index === topRows.length - 1) && true || undefined,
            };

            rowLayoutMap.set(rowId, layout);
        });

        this._bodyRows.forEach((row, index) => {
            const rowId = row.id as RowId;
            const layout: RowLayout = {
                index: index,
                row,
                height: this.dataGrid.options.rowHeight,
                top: (rowLayoutMap.size || 0) * this.dataGrid.options.rowHeight + index * this.dataGrid.options.rowHeight,
                pinned: undefined,
            };

            rowLayoutMap.set(rowId, layout);
        });

        this._bottomRows?.forEach((row, index, bottomRows) => {
            const rowId = row.id as RowId;
            const layout: RowLayout = {
                index: index,
                row,
                height: this.dataGrid.options.rowHeight,
                bottom: (bottomRows.length - index) * this.dataGrid.options.rowHeight,
                pinned: 'bottom',
                firstPinnedBottom: (index === 0) && true || undefined,
                lastPinnedBottom: (index === bottomRows.length - 1) && true || undefined,
            };

            rowLayoutMap.set(rowId, layout);
        });

        this.dataGrid.layout.rowLayoutsState.set(rowLayoutMap);
    };

    private updateRowLayouts = () => {
        const { rowLayoutsState, scrollAreaState } = this.dataGrid.layout;
        if (!this._topRows.length && !this._topRows.length) {
            return;
        }

        const viewportHeight = scrollAreaState.value?.clientHeight || 0;
        const baseTop = scrollAreaState.value!.scrollTop || 0;
        const baseBottom = scrollAreaState.value!.scrollHeight - viewportHeight - baseTop;


        let calculatedTop = baseTop;
        let calculatedBottom = baseBottom;

        this._topRows.forEach((row) => {
            const rowLayout = rowLayoutsState.get(row.id)!;

            let top: number | undefined = undefined;

            top = calculatedTop;
            calculatedTop += rowLayout.height;

            const needUpdate = rowLayout.top !== top;
            if (!needUpdate) {
                return;
            }

            rowLayoutsState.replaceItem(rowLayout.row.id, {
                ...rowLayout,
                top
            });
        });

        this._bottomRows.forEach((row) => {
            const rowLayout = rowLayoutsState.get(row.id)!;

            let bottom: number | undefined = undefined;
            bottom = calculatedBottom;
            calculatedBottom -= rowLayout.height;

            const needUpdate = rowLayout.bottom !== bottom;
            if (!needUpdate) {
                return;
            }

            rowLayoutsState.replaceItem(rowLayout.row.id, {
                ...rowLayout,
                bottom
            });
        });
    };

    private handleScroll = () => {
        const isVerticalScroll = this.dataGrid.layout.scrollAreaState.value?.scrollTop !== this.lastScrollTop;
        if (!isVerticalScroll) {
            return;
        }

        this.lastScrollTop = this.dataGrid.layout.scrollAreaState.value?.scrollTop || 0;
        this.updateRowLayouts();
    };

    public handleActivate = () => {
        this.dataGrid.layout.scrollAreaState.value?.addEventListener('scroll', this.handleScroll);

        const unwatchRowLayouts = this.dataGrid.state.rows.watch((newRows) => {
            this._topRows = newRows.filter((row) => this.options.pinnedTopRows?.includes(row.key));
            this._bodyRows = newRows.filter((row) => !this.options.pinnedTopRows?.includes(row.key) && !this.options.pinnedBottomRows?.includes(row.key));
            this._bottomRows = newRows.filter((row) => this.options.pinnedBottomRows?.includes(row.key));

            this.createRowLayouts();
            this.updateRowLayouts();
        });

        this.unsubscribes.push(unwatchRowLayouts);
    };
}
