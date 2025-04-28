import type { Id, RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';

export interface LayoutPluginOptions {
}

export class LayoutPlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, LayoutPluginOptions> {
    private updateHeaderNodes = () => {
        const { columnMinWidth, columnMaxWidth } = this.dataGrid.options;
        const { headers } = this.dataGrid.state;
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        const headerNodes = layoutNodesState.values().filter((node) => node.type === 'header').toArray();

        const scrollAreaWidth = this.scrollArea!.clientWidth;
        const columnCount = headers.value.length;
        const defaultColumnWidth = Math.floor(scrollAreaWidth / columnCount);
        const columnWidth = Math.max(columnMinWidth, Math.min(defaultColumnWidth, columnMaxWidth));

        headers.value.forEach((header) => {
            const headerId = header.id as Id;
            const headerNode = headerNodes.find((node) => node.id === headerId);

            if (!headerNode) {
                return;
            }

            updateNode(this, headerId, {
                size: {
                    width: columnWidth,
                }
            });
        });
    };

    private updateHeaderGroupNodes = () => {
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        const headerGroupNode = layoutNodesState.get('headerGroup:1');
        if (!headerGroupNode) {
            return;
        }

        const headerNodes = layoutNodesState.values().filter((node) => node.type === 'header').toArray();
        const width = headerNodes.reduce((acc, node) => acc + node.size.width!, 0);

        updateNode(this, 'headerGroup:1', {
            size: {
                width: width,
            }
        });
    };

    private updateRowNodes = () => {
        const { layoutNodesState, updateNode } = this.dataGrid.layout;

        const headerGroupNode = layoutNodesState.get('headerGroup:1');
        if (!headerGroupNode) {
            return;
        }

        let rowsHeight = 0;
        const rowNodes = layoutNodesState.values().filter((node) => node.type === 'row');
        rowNodes.forEach((node) => {
            rowsHeight += node.size.height!;
            updateNode(this, node.id, {
                size: {
                    width: headerGroupNode.size.width,
                }
            });
        });

        const rowContainerNode = layoutNodesState.get('rowContainer:1');
        if (rowContainerNode) {
            updateNode(this, rowContainerNode.id, {
                size: {
                    width: headerGroupNode.size.width,
                    height: rowsHeight
                }
            });
        }
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
                size: {
                    width: headerNode.size.width
                }
            });
        });
    };

    public handleActivate = () => {
        const watchHeaders = this.dataGrid.state.headers.watch(() => {
            this.updateHeaderNodes();
            this.updateHeaderGroupNodes();
            this.updateRowNodes();
            this.updateCellNodes();
        });

        this.unsubscribes.push(watchHeaders);

        const resizeObserver = new ResizeObserver(() => {
            this.updateHeaderNodes();
            this.updateHeaderGroupNodes();
            this.updateRowNodes();
            this.updateCellNodes();
        });
        resizeObserver.observe(this.scrollArea!);
        this.unsubscribes.push(() => {
            resizeObserver.disconnect();
        });
    };
}
