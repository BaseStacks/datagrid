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
    private _bottomRowsDescending: Row[] = [];


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
                top: (index + this._topRows.length) * this.dataGrid.options.rowHeight,
                pinned: undefined,
            };

            rowLayoutMap.set(rowId, layout);
        });
        
        this._bottomRows.forEach((row, index, bottomRows) => {
            const rowId = row.id as RowId;
            const layout: RowLayout = {
                index: index,
                row,
                height: this.dataGrid.options.rowHeight,
                bottom: (bottomRows.length - index) * this.dataGrid.options.rowHeight,
                firstPinnedBottom: (index === 0) && true || undefined,
                lastPinnedBottom: (index === bottomRows.length - 1) && true || undefined,
                pinned: 'bottom'
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

        const baseTop = scrollAreaState.value!.scrollTop || 0;

        let calculatedTop = baseTop;

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

        const viewportHeight = scrollAreaState.value?.clientHeight || 0;
        const baseBottom = scrollAreaState.value!.scrollHeight - viewportHeight - baseTop;
        let calculatedBottom = baseBottom;

        this._bottomRowsDescending.forEach((row) => {
            const rowLayout = rowLayoutsState.get(row.id)!;

            let bottom: number | undefined = undefined;
            bottom = calculatedBottom;
            calculatedBottom += rowLayout.height;

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
            const { pinnedTopRows, pinnedBottomRows } = this.options;

            this._topRows = pinnedTopRows ? pinnedTopRows.map(o => newRows.find((row) => row.key === o)).filter(o => !!o) : [];
            this._bottomRows = pinnedBottomRows ? pinnedBottomRows.map(o => newRows.find((row) => row.key === o)).filter(o => !!o) : [];
            this._bottomRowsDescending = [...this._bottomRows].reverse();

            this._bodyRows = newRows.filter((row) => {
                const rowId = row.id as RowId;
                return !this._topRows.some((topRow) => topRow.id === rowId) && !this._bottomRows.some((bottomRow) => bottomRow.id === rowId);
            });

            this.createRowLayouts();
            this.updateRowLayouts();
        });

        this.unsubscribes.push(unwatchRowLayouts);
    };
}
