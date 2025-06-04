import { type ColumnKey, type ColumnHeader, type RowData, createId, type Id } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import type { DataGridHeaderNode, DataGridLayoutNodeBase } from '../cores/DataGridLayout';

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
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        let leftWidth = 0;
        this._leftHeaders.forEach((header, index, leftHeaders) => {
            const headerNode = layoutNodesState.get(header.id) as DataGridHeaderNode;

            leftWidth += headerNode.size.width!;

            const pinned: DataGridLayoutNodeBase['pinned'] = {
                side: 'left',
                first: (index === 0),
                last: (index === leftHeaders.length - 1)
            };

            updateNode(headerNode.id, { pinned });

            const footerId = createId({ type: 'footer', columnKey: header.column.key }) as Id;
            const footerNode = layoutNodesState.get(footerId) as DataGridHeaderNode;
            if (footerNode) {
                updateNode(footerNode.id, { pinned });
            }
        });

        this._bodyHeaders.forEach((header) => {
            const headerNode = layoutNodesState.get(header.id) as DataGridHeaderNode;

            const offset = {
                left: leftWidth
            };
            updateNode(headerNode.id, { offset });

            const footerId = createId({ type: 'footer', columnKey: header.column.key }) as Id;
            const footerNode = layoutNodesState.get(footerId) as DataGridHeaderNode;
            if (footerNode) {
                updateNode(footerNode.id, { offset });
            }

            leftWidth += headerNode.size.width!;
        });

        this._rightHeaders.forEach((header, index, rightHeaders) => {
            const headerNode = layoutNodesState.get(header.id) as DataGridHeaderNode;

            const pinned: DataGridLayoutNodeBase['pinned'] = {
                side: 'right',
                first: (index === 0),
                last: (index === rightHeaders.length - 1)
            };

            updateNode(headerNode.id, {
                pinned: {
                    side: 'right',
                    first: (index === 0),
                    last: (index === rightHeaders.length - 1)
                }
            });

            const footerId = createId({ type: 'footer', columnKey: header.column.key }) as Id;
            const footerNode = layoutNodesState.get(footerId) as DataGridHeaderNode;
            if (footerNode) {
                updateNode(footerNode.id, { pinned });
            }
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

            const offset = {
                left: nodeOffset
            };
            updateNode(header.id, { offset });

            const footerId = createId({ type: 'footer', columnKey: header.column.key }) as Id;
            const footerNode = layoutNodesState.get(footerId);
            if (footerNode) {
                updateNode(footerId, { offset });
            }
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

            const offset = {
                left: nodeOffset
            };

            updateNode(header.id, { offset });

            const footerId = createId({ type: 'footer', columnKey: header.column.key }) as Id;
            const footerNode = layoutNodesState.get(footerId);
            if (footerNode) {
                updateNode(footerId, { offset });
            }
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
