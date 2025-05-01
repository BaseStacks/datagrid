import type { ColumnKey, ColumnHeader, RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import type { DataGridHeaderNode } from '../cores/DataGridLayout';

export interface ColumnPinningPluginOptions {
    readonly pinnedLeftColumns?: ColumnKey[];
    readonly pinnedRightColumns?: ColumnKey[];
}

export class ColumnPinningPlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, ColumnPinningPluginOptions> {
    private _lastScrollLeft: number = 0;

    private _leftHeaders: ColumnHeader[] = [];
    private _bodyHeaders: ColumnHeader[] = [];
    private _rightHeaders: ColumnHeader[] = [];
    private _rightHeadersDesc: ColumnHeader[] = [];

    private setupHeaderNodes = () => {
        const { headers } = this.dataGrid.state;
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        // Set default column width based on scrollArea width
        const scrollAreaWidth = this.scrollArea!.clientWidth;
        const columnCount = headers.value.length;
        const defaultColumnWidth = Math.floor(scrollAreaWidth / columnCount);
        const columnWidth = Math.max(this.dataGrid.options.columnMinWidth, Math.min(defaultColumnWidth, this.dataGrid.options.columnMaxWidth));

        this._leftHeaders.forEach((header, index, leftHeaders) => {
            const headerNode = layoutNodesState.get(header.id) as DataGridHeaderNode;

            updateNode(headerNode.id, {
                pinned: {
                    side: 'left',
                    first: (index === 0),
                    last: (index === leftHeaders.length - 1)
                }
            });
        });

        this._bodyHeaders.forEach((header, index) => {
            const headerNode = layoutNodesState.get(header.id) as DataGridHeaderNode;

            updateNode(headerNode.id, {
                offset: {
                    left: (index + this._leftHeaders.length) * columnWidth
                }
            });
        });

        this._rightHeaders.forEach((header, index, rightHeaders) => {
            const headerNode = layoutNodesState.get(header.id) as DataGridHeaderNode;

            updateNode(headerNode.id, {
                pinned: {
                    side: 'right',
                    first: (index === 0),
                    last: (index === rightHeaders.length - 1)
                }
            });
        });
    };

    private updateHeaderNodes = () => {
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        const baseLeft = this.scrollArea!.scrollLeft;

        let pinnedLeftOffset = baseLeft;

        this._leftHeaders.forEach((header) => {
            const headerNode = layoutNodesState.get(header.id);
            if (!headerNode) {
                return;
            }

            const nodeOffset = pinnedLeftOffset;
            pinnedLeftOffset += headerNode.size.width!;

            const needUpdate = headerNode.offset.left !== nodeOffset;
            if (!needUpdate) {
                return;
            }

            updateNode(header.id, {
                offset: {
                    left: nodeOffset
                }
            });
        });

        const viewportWidth = this.scrollArea!.clientWidth;
        let pinnedRightOffset = baseLeft + viewportWidth;
        this._rightHeadersDesc.forEach((header) => {
            const headerNode = layoutNodesState.get(header.id);
            if (!headerNode) {
                return;
            }

            pinnedRightOffset -= headerNode.size.width!;
            const nodeOffset = pinnedRightOffset;

            const needUpdate = headerNode.offset.left !== nodeOffset;
            if (!needUpdate) {
                return;
            }

            updateNode(header.id, {
                offset: {
                    left: nodeOffset
                }
            });
        });
    };

    private updateCellNodes = () => {
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        const cellNodes = layoutNodesState.values().filter((node) => node.type === 'cell');

        cellNodes.forEach((cellNode) => {
            const headerNode = layoutNodesState.get(cellNode.headerId);
            if (!headerNode) {
                return;
            }

            updateNode(cellNode.id, {
                pinned: headerNode.pinned,
                offset: {
                    left: headerNode.offset.left
                }
            });
        });
    };

    private handleContainerScroll = () => {
        const isScrollingLeft = this.scrollArea!.scrollLeft != this._lastScrollLeft;
        if (!isScrollingLeft) {
            return;
        }

        this._lastScrollLeft = this.scrollArea!.scrollLeft;
        this.updateHeaderNodes();
        this.updateCellNodes();
    };

    public handleActivate = () => {
        this.scrollArea!.addEventListener('scroll', this.handleContainerScroll);
        this.unsubscribes.push(() => {
            this.scrollArea!.removeEventListener('scroll', this.handleContainerScroll);
        });

        const watchHeaders = this.dataGrid.state.headers.watch((newHeaders) => {
            const { pinnedRightColumns, pinnedLeftColumns } = this.options;

            this._leftHeaders = pinnedLeftColumns ? newHeaders.filter((header) => pinnedLeftColumns.includes(header.column.key)) : [];
            this._rightHeaders = pinnedRightColumns ? newHeaders.filter((header) => pinnedRightColumns.includes(header.column.key)) : [];
            this._bodyHeaders = newHeaders.filter(header => !this._leftHeaders.includes(header) && !this._rightHeaders.includes(header));
            this._rightHeadersDesc = [...this._rightHeaders].reverse();

            this.setupHeaderNodes();
            this.updateHeaderNodes();
            this.updateCellNodes();
        });
        this.unsubscribes.push(watchHeaders);

        const resizeObserver = new ResizeObserver(() => {
            this.updateHeaderNodes();
            this.updateCellNodes();
        });
        resizeObserver.observe(this.scrollArea!);
        this.unsubscribes.push(() => {
            resizeObserver.disconnect();
        });
    };
}
