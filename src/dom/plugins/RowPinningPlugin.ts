import type { Row, RowData, RowId, RowKey } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';

export interface RowPinningPluginOptions {
    readonly pinnedTopRows?: RowKey[];
    readonly pinnedBottomRows?: RowKey[];
}

export class RowPinningPlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, RowPinningPluginOptions> {
    private lastScrollTop = 0;

    private _topRows: Row[] = [];
    private _bodyRows: Row[] = [];
    private _bottomRows: Row[] = [];
    private _bottomRowsDescending: Row[] = [];

    private setupRows = () => {
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        this._topRows?.forEach((row, index, topRows) => {
            const node = layoutNodesState.get(row.id);
            if (!node) {
                return;
            }

            updateNode(node.id, {
                pinned: {
                    side: 'top',
                    first: (index === 0),
                    last: (index === topRows.length - 1)
                },
                size: {
                    height: this.dataGrid.options.rowHeight
                },
                offset: {
                    top: index * this.dataGrid.options.rowHeight
                }
            });
        });

        this._bodyRows.forEach((row, index) => {
            const node = layoutNodesState.get(row.id);
            if (!node) {
                return;
            }

            updateNode(node.id, {
                size: {
                    height: this.dataGrid.options.rowHeight,
                },
                offset: {
                    top: (index + this._topRows.length) * this.dataGrid.options.rowHeight
                }
            });
        });

        this._bottomRows.forEach((row, index, bottomRows) => {
            const node = layoutNodesState.get(row.id);
            if (!node) {
                return;
            }

            updateNode(node.id, {
                pinned: {
                    side: 'bottom',
                    first: (index === 0),
                    last: (index === bottomRows.length - 1)
                },
                size: {
                    height: this.dataGrid.options.rowHeight,
                },
                offset: {
                    top: (index + this._topRows.length + this._bodyRows.length) * this.dataGrid.options.rowHeight
                }
            });
        });
    };

    private updateRows = () => {
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        if (!this._topRows.length || !this._bottomRows.length) {
            return;
        }

        const baseTop = this.scrollArea!.scrollTop || 0;
        let calculatedTopOffset = baseTop;
        this._topRows.forEach((row) => {
            const node = layoutNodesState.get(row.id);
            if (!node) {
                return;
            }

            const pinnedOffset = calculatedTopOffset;
            calculatedTopOffset += node.size.height!;

            const needUpdate = node.offset.top !== pinnedOffset;
            if (!needUpdate) {
                return;
            }

            updateNode(node.id, {
                offset: {
                    top: pinnedOffset
                }
            });
        });

        const viewportHeight = this.scrollArea!.clientHeight;
        let calculatedBottomOffset = baseTop + viewportHeight;
        this._bottomRowsDescending.forEach((row) => {
            const node = layoutNodesState.get(row.id);
            if (!node) {
                return;
            }

            calculatedBottomOffset -= node.size.height!;
            const bottomOffset = calculatedBottomOffset;

            const needUpdate = node.offset.top !== bottomOffset;
            if (!needUpdate) {
                return;
            }

            updateNode(node.id, {
                offset: {
                    top: bottomOffset
                }
            });
        });
    };

    private handleScroll = () => {
        const isVerticalScroll = this.scrollArea!.scrollTop !== this.lastScrollTop;
        if (!isVerticalScroll) {
            return;
        }

        this.lastScrollTop = this.scrollArea!.scrollTop || 0;
        this.updateRows();
    };

    public handleActivate = () => {
        this.scrollArea!.addEventListener('scroll', this.handleScroll);
        this.unsubscribes.push(() => {
            this.scrollArea!.removeEventListener('scroll', this.handleScroll);
        });

        const unwatchRowLayouts = this.dataGrid.state.rows.watch((newRows) => {
            const { pinnedTopRows, pinnedBottomRows } = this.options;

            this._topRows = pinnedTopRows ? pinnedTopRows.map(o => newRows.find((row) => row.key === o)).filter(o => !!o) : [];
            this._bottomRows = pinnedBottomRows ? pinnedBottomRows.map(o => newRows.find((row) => row.key === o)).filter(o => !!o) : [];
            this._bottomRowsDescending = [...this._bottomRows].reverse();

            this._bodyRows = newRows.filter((row) => {
                const rowId = row.id as RowId;
                return !this._topRows.some((topRow) => topRow.id === rowId) && !this._bottomRows.some((bottomRow) => bottomRow.id === rowId);
            });

            this.setupRows();
            this.updateRows();
        });

        this.unsubscribes.push(unwatchRowLayouts);
    };
}
