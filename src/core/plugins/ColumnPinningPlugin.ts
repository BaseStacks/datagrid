import { DataGridPlugin } from '../instances/atomic/DataGridPlugin';
import type { DataGridHeaderNode } from '../instances/DataGridLayout';
import type { ColumnKey, ColumnHeader } from '../types';

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

    private setupHeaderNodes = () => {
        const { headers } = this.dataGrid.state;
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        // Set default column width based on scrollArea width
        const scrollAreaWidth = this.scrollArea.clientWidth;
        const columnCount = headers.value.length;
        const defaultColumnWidth = Math.floor(scrollAreaWidth / columnCount);
        const columnWidth = Math.max(this.dataGrid.options.columnMinWidth, Math.min(defaultColumnWidth, this.dataGrid.options.columnMaxWidth));

        this._leftHeaders.forEach((header, index, leftHeaders) => {
            const headerNode = layoutNodesState.get(header.id) as DataGridHeaderNode;

            updateNode(this, headerNode.id, {
                attributes: {
                    'data-pinned': 'left',
                    'data-fist-left': (index === 0) || undefined,
                    'data-last-left': (index === leftHeaders.length - 1) || undefined,
                }
            });
        });

        this._bodyHeaders.forEach((header, index) => {
            const headerNode = layoutNodesState.get(header.id) as DataGridHeaderNode;

            updateNode(this, headerNode.id, {
                rect: {
                    left: (index + this._leftHeaders.length) * columnWidth
                }
            });
        });

        this._rightHeaders.forEach((header, index, rightHeaders) => {
            const headerNode = layoutNodesState.get(header.id) as DataGridHeaderNode;

            updateNode(this, headerNode.id, {
                attributes: {
                    'data-pinned': 'right',
                    'data-first-right': (index === 0) || undefined,
                    'data-last-right': (index === rightHeaders.length - 1) || undefined,
                }
            });
        });
    };

    private updateHeaderNodes = () => {
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        const viewportWidth = this.scrollArea.clientWidth;
        const baseLeft = this.scrollArea.scrollLeft;
        const baseRight = this.scrollArea.scrollWidth - viewportWidth - baseLeft;

        let calculatedLeft = baseLeft;
        let calculatedRight = baseRight;

        this._leftHeaders.forEach((header) => {
            const headerNode = layoutNodesState.get(header.id);
            if (!headerNode) {
                return;
            }

            const left = calculatedLeft;
            calculatedLeft += headerNode.rect.width!;

            const needUpdate = headerNode.rect.left !== left;
            if (!needUpdate) {
                return;
            }

            updateNode(this, header.id, {
                ...headerNode,
                rect: {
                    ...headerNode.rect,
                    left
                }
            });
        });

        this._rightHeadersDesc.forEach((header) => {
            const headerNode = layoutNodesState.get(header.id);
            if (!headerNode) {
                return;
            }

            const right = calculatedRight;
            calculatedRight += headerNode.rect.width!;

            const needUpdate = headerNode.rect.right !== right;
            if (!needUpdate) {
                return;
            }

            updateNode(this, header.id, {
                ...headerNode,
                rect: {
                    ...headerNode.rect,
                    right
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

            updateNode(this, cellNode.id, {
                rect: {
                    left: headerNode.rect.left,
                    right: headerNode.rect.right,
                },
                attributes: headerNode.attributes
            });
        });
    };

    private handleContainerScroll = () => {
        const isScrollingLeft = this.scrollArea.scrollLeft != this._lastScrollLeft;
        if (!isScrollingLeft) {
            return;
        }

        this._lastScrollLeft = this.scrollArea.scrollLeft;
        this.updateHeaderNodes();
        this.updateCellNodes();
    };

    public handleActivate = () => {
        this.dataGrid.layout.registerAttributes(this, ['data-pinned', 'data-fist-left', 'data-last-left', 'data-first-right', 'data-last-right']);

        this.scrollArea.addEventListener('scroll', this.handleContainerScroll);
        this.unsubscribes.push(() => {
            this.scrollArea.removeEventListener('scroll', this.handleContainerScroll);
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
        resizeObserver.observe(this.scrollArea);
        this.unsubscribes.push(() => {
            resizeObserver.disconnect();
        });
    };
}
