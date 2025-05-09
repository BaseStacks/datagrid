import { DataGridState, type DataGridPluginOptions } from '../../host';
import type { RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import type { DataGridCellNode, DataGridLayoutNode } from '../cores/DataGridLayout';

export interface CellEditablePluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

export interface FloatingEditor {
    readonly activeCellNode: DataGridLayoutNode | null;
    readonly activeRowNode: DataGridLayoutNode | null;
    readonly baseScrollLeft: number;
    readonly baseScrollTop: number;
    readonly baseLeft: number;
    readonly baseTop: number;
}

export class CellEditablePlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, CellEditablePluginOptions> {
    private updateEditorPosition = () => {
        const { activeCell, editing } = this.dataGrid.state;

        if (!activeCell.value || !editing.value) {
            return;
        }

        const {
            activeCellNode,
            activeRowNode,
            baseLeft,
            baseTop,
            baseScrollLeft,
            baseScrollTop
        } = this.state.floatingEditor.value!;

        const pinnedHorizontally = activeCellNode?.pinned?.side === 'left' || activeCellNode?.pinned?.side === 'right';
        const pinnedVertically = activeRowNode?.pinned?.side === 'top' || activeRowNode?.pinned?.side === 'bottom';

        this.dataGrid.layout.updateNode('editorContainer', {
            offset: {
                left: pinnedHorizontally ? baseLeft + this.scrollArea!.scrollLeft : baseLeft + baseScrollLeft,
                top: pinnedVertically ? baseTop + this.scrollArea!.scrollTop : baseTop + baseScrollTop,
            },
            pinned: activeCellNode?.pinned ?? activeRowNode?.pinned,
        });
    };

    private setupFloatingEditor = (cellNode: DataGridCellNode) => {
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

        const rowNode = this.dataGrid.layout.getNode(cellNode.rowId);

        this.state.floatingEditor.set({
            activeCellNode: cellNode,
            activeRowNode: rowNode,
            baseScrollLeft: this.scrollArea!.scrollLeft,
            baseScrollTop: this.scrollArea!.scrollTop,
            baseLeft: cellRect.left,
            baseTop: cellRect.top,
        });
    };

    private startEditing = () => {
        const { activeCell, editing } = this.dataGrid.state;

        if (!activeCell.value) {
            return;
        }

        const cellNode = this.dataGrid.layout.getNode(activeCell.value.id) as DataGridCellNode;
        const column = this.dataGrid.state.headers.value.find((header) => header.id === cellNode.headerId)?.column;
        if (!cellNode || !column || !column.editor) {
            return;
        }

        const isInlineEditor = typeof column.editor === 'function';

        editing.set(isInlineEditor ? 'inline' : 'floating');

        if (editing.value === 'inline') {
            return;
        }

        const editorContainerNode = this.dataGrid.layout.getNode('editorContainer');
        if (!editorContainerNode) {
            return;
        }

        this.setupFloatingEditor(cellNode);
    };

    private stopEditing = () => {
        const {  editing } = this.dataGrid.state;
        editing.set(false);
    };

    private handleDblClick = (event: MouseEvent) => {
        this.startEditing();
        event.stopPropagation();
    };

    public state = {
        floatingEditor: new DataGridState<FloatingEditor | null>(null),
    };

    private handleScroll = () => {
        this.updateEditorPosition();
    };

    public handleActivate = () => {
        const unwatchEditing = this.dataGrid.state.editing.watch((editing) => {
            if (!editing) {
                this.state.floatingEditor.set(null);
            }
        });

        const unwatchNodes = this.dataGrid.layout.layoutNodesState.watchItems(({ item }) => {
            item.element.addEventListener('dblclick', this.handleDblClick);
        });

        this.scrollArea?.addEventListener('scroll', this.handleScroll);

        this.dataGrid.keyBindings.add(this,
            {
                focus: ['Enter', 'F2'],
                exit: 'Escape',
            },
            {
                focus: this.startEditing,
                exit: this.stopEditing
            }
        );

        this.unsubscribes.push(unwatchEditing);
        this.unsubscribes.push(unwatchNodes);
        this.unsubscribes.push(() => {
            this.scrollArea?.removeEventListener('scroll', this.handleScroll);
        });

        this.unsubscribes.push(() => {
            this.dataGrid.keyBindings.remove(this);
        });
    };
}
