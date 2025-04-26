import { DataGridPlugin } from '../instances/atomic/DataGridPlugin';
import type { Row, RowId, RowKey } from '../types';

export interface RowPinningPluginOptions {
    readonly pinnedTopRows?: RowKey[];
    readonly pinnedBottomRows?: RowKey[];
}

export class RowPinningPlugin extends DataGridPlugin<RowPinningPluginOptions> {
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

            updateNode(this, node.id, {
                rect: {
                    height: this.dataGrid.options.rowHeight,
                    top: index * this.dataGrid.options.rowHeight,
                    bottom: undefined,
                },
                attributes: {
                    'data-pinned': 'top',
                    'data-first-top': (index === 0) || undefined,
                    'data-last-top': (index === topRows.length - 1) || undefined,
                }
            });
        });

        this._bodyRows.forEach((row, index) => {
            const node = layoutNodesState.get(row.id);
            if (!node) {
                return;
            }

            updateNode(this, node.id, {
                rect: {
                    height: this.dataGrid.options.rowHeight,
                    top: (index + this._topRows.length) * this.dataGrid.options.rowHeight,
                    bottom: undefined,
                },
                attributes: {}
            });
        });

        this._bottomRows.forEach((row, index, bottomRows) => {
            const node = layoutNodesState.get(row.id);
            if (!node) {
                return;
            }

            updateNode(this, node.id, {
                rect: {
                    height: this.dataGrid.options.rowHeight,
                    top: (index + this._topRows.length + this._bodyRows.length) * this.dataGrid.options.rowHeight,
                    bottom: undefined,
                },
                attributes: {
                    'data-pinned': 'bottom',
                    'data-first-bottom': (index === 0) || undefined,
                    'data-last-bottom': (index === bottomRows.length - 1) || undefined,
                }
            });
        });
    };

    private updateRows = () => {
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        if (!this._topRows.length || !this._bottomRows.length) {
            return;
        }

        const baseTop = this.scrollArea.scrollTop || 0;


        let calculatedTop = baseTop;

        this._topRows.forEach((row) => {
            const node = layoutNodesState.get(row.id);
            if (!node) {
                return;
            }

            const top = calculatedTop;
            calculatedTop += node.rect.height!;

            const needUpdate = node.rect.top !== top;
            if (!needUpdate) {
                return;
            }

            updateNode(this, node.id, {
                rect: {
                    top
                }
            });
        });

        const viewportHeight = this.scrollArea.clientHeight || 0;
        const baseBottom = this.scrollArea.scrollHeight - viewportHeight - baseTop;

        let calculatedBottom = baseBottom;

        this._bottomRowsDescending.forEach((row) => {
            const node = layoutNodesState.get(row.id);
            if (!node) {
                return;
            }

            const bottom = calculatedBottom;
            calculatedBottom += node.rect.height!;

            const needUpdate = node.rect.bottom !== bottom;
            if (!needUpdate) {
                return;
            }

            updateNode(this, node.id, {
                rect: {
                    top: undefined,
                    bottom
                }
            });
        });
    };

    private handleScroll = () => {
        const isVerticalScroll = this.scrollArea.scrollTop !== this.lastScrollTop;
        if (!isVerticalScroll) {
            return;
        }

        this.lastScrollTop = this.scrollArea.scrollTop || 0;
        this.updateRows();
    };

    public handleActivate = () => {
        this.dataGrid.layout.registerAttributes(this, ['data-pinned', 'data-first-top', 'data-last-top', 'data-first-bottom', 'data-last-bottom']);

        this.scrollArea.addEventListener('scroll', this.handleScroll);
        this.unsubscribes.push(() => {
            this.scrollArea.removeEventListener('scroll', this.handleScroll);
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
