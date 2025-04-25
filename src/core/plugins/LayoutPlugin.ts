import { DataGridPlugin } from '../instances/atomic/DataGridPlugin';
import type { Id } from '../types';

export interface LayoutPluginOptions {
}

export class LayoutPlugin extends DataGridPlugin<LayoutPluginOptions> {
    private updateHeaderNodes = () => {
        const { columnMinWidth, columnMaxWidth } = this.dataGrid.options;
        const { headers } = this.dataGrid.state;
        const { layoutNodesState } = this.dataGrid.layout;

        const headerNodes = layoutNodesState.values().filter((node) => node.type === 'header').toArray();

        const scrollAreaWidth = this.scrollArea.clientWidth;
        const columnCount = headers.value.length;
        const defaultColumnWidth = Math.floor(scrollAreaWidth / columnCount);
        const columnWidth = Math.max(columnMinWidth, Math.min(defaultColumnWidth, columnMaxWidth));

        headers.value.forEach((header) => {
            const headerId = header.id as Id;
            const headerNode = headerNodes.find((node) => node.id === headerId);

            if (!headerNode) {
                return;
            }

            layoutNodesState.replaceItem(headerId, {
                ...headerNode,
                rect: {
                    ...headerNode.rect,
                    width: columnWidth,
                }
            });
        });
    };

    private updateHeaderGroupNodes = () => {
        const { layoutNodesState } = this.dataGrid.layout;
        
        const headerGroupNode = layoutNodesState.get('headerGroup:1');
        if (!headerGroupNode) {
            return;
        }

        const headerNodes = layoutNodesState.values().filter((node) => node.type === 'header').toArray();
        const width = headerNodes.reduce((acc, node) => acc + node.rect.width!, 0);
        
        layoutNodesState.replaceItem('headerGroup:1', {
            ...headerGroupNode,
            rect: {
                ...headerGroupNode.rect,
                width: width,
            }
        });
    };

    public handleActivate = () => {
        const watchHeaders = this.dataGrid.state.headers.watch(() => {
            this.updateHeaderNodes();
            this.updateHeaderGroupNodes();
        });

        this.unsubscribes.push(watchHeaders);

        const resizeObserver = new ResizeObserver(() => {
            this.updateHeaderNodes();
            this.updateHeaderGroupNodes();
        });
        resizeObserver.observe(this.scrollArea);
        this.unsubscribes.push(() => {
            resizeObserver.disconnect();
        });
    };
}
