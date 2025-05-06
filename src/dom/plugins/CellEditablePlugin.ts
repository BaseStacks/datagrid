import { type DataGridPluginOptions } from '../../host';
import type { RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import type { DataGridCellNode, DataGridLayoutNode } from '../cores/DataGridLayout';

export interface CellEditablePluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

export class CellEditablePlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, CellEditablePluginOptions> {

    private activeCellNode: DataGridLayoutNode | null = null;
    private activeRowNode: DataGridLayoutNode | null = null;

    private baseScrollLeft: number = 0;
    private baseScrollTop: number = 0;
    private baseLeft: number = 0;
    private baseTop: number = 0;

    private updateEditorPosition = () => {
        const { activeCell, editing } = this.dataGrid.state;

        if (!activeCell.value || !editing.value) {
            return;
        }

        const pinnedHorizontally = this.activeCellNode?.pinned?.side === 'left' || this.activeCellNode?.pinned?.side === 'right';
        const pinnedVertically = this.activeRowNode?.pinned?.side === 'top' || this.activeRowNode?.pinned?.side === 'bottom';
        
        this.dataGrid.layout.updateNode('editorContainer', {
            offset: {
                left: pinnedHorizontally ? this.baseLeft + this.scrollArea!.scrollLeft : this.baseLeft + this.baseScrollLeft,
                top: pinnedVertically ? this.baseTop + this.scrollArea!.scrollTop : this.baseTop + this.baseScrollTop,
            },
            pinned: this.activeCellNode?.pinned ?? this.activeRowNode?.pinned,
        });
    };

    private startEditing = () => {
        const { activeCell, editing } = this.dataGrid.state;

        if (!activeCell.value) {
            return;
        }

        const cellNode = this.dataGrid.layout.getNode(activeCell.value.id) as DataGridCellNode;
        const editorContainerNode = this.dataGrid.layout.getNode('editorContainer');
        if (!cellNode || !editorContainerNode) {
            return;
        }

        const nodeRect = cellNode.element.getBoundingClientRect();
        const containerRect = this.scrollArea!.getBoundingClientRect();
        const cellRect = {
            left: nodeRect.left - containerRect.left,
            top: nodeRect.top - containerRect.top,
            width: nodeRect.width,
            height: nodeRect.height
        };

        this.dataGrid.layout.updateNode('editorContainer', {
            offset: {
                left: cellRect.left + this.scrollArea!.scrollLeft,
                top: cellRect.top + this.scrollArea!.scrollTop,
            },
            size: {
                width: cellRect.width,
                height: cellRect.height,
            },
        });

        editing.set(true);

        const rowNode = this.dataGrid.layout.getNode(cellNode.rowId);

        this.activeCellNode = cellNode;
        this.activeRowNode = rowNode;

        this.baseLeft = cellRect.left;
        this.baseTop = cellRect.top;
        this.baseScrollLeft = this.scrollArea!.scrollLeft;
        this.baseScrollTop = this.scrollArea!.scrollTop;
    };

    private handleDblClick = (event: MouseEvent) => {
        this.startEditing();
        event.stopPropagation();
    };

    private handleScroll = () => {
        this.updateEditorPosition();
    };

    public handleActivate = () => {
        const unwatchEditing = this.dataGrid.state.editing.watch((editing) => {
            if (!editing) {
                this.activeCellNode = null;
                this.baseLeft = 0;
                this.baseTop = 0;
            }
        });

        const unwatchNodes = this.dataGrid.layout.layoutNodesState.watchItems(({ item }) => {
            item.element.addEventListener('dblclick', this.handleDblClick);
        });

        this.scrollArea?.addEventListener('scroll', this.handleScroll);

        this.unsubscribes.push(unwatchEditing);
        this.unsubscribes.push(unwatchNodes);
        this.unsubscribes.push(() => {
            this.scrollArea?.removeEventListener('scroll', this.handleScroll);
        });
    };
}
