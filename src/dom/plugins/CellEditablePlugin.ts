import { type DataGridPluginOptions } from '../../host';
import type { RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import { getRect } from '../utils/domRectUtils';

export interface CellEditablePluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

export class CellEditablePlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, CellEditablePluginOptions> {

    private updateEditorPosition = () => {
        const { activeCell, editing } = this.dataGrid.state;

        if (!activeCell.value || !editing.value) {
            return;
        }

        const cellNode = this.dataGrid.layout.getNode(activeCell.value.id);
        const editorContainerNode = this.dataGrid.layout.getNode('editorContainer');
        if (!cellNode || !editorContainerNode) {
            return;
        }

        const cellRect = getRect(this.scrollArea!, cellNode.element);

        this.dataGrid.layout.updateNode('editorContainer', {
            offset: {
                left: cellRect.left,
                top: cellRect.top,
            }
        });
    };

    private startEditing = () => {
        const { activeCell, editing } = this.dataGrid.state;

        if (!activeCell.value) {
            return;
        }

        const cellNode = this.dataGrid.layout.getNode(activeCell.value.id);
        const editorContainerNode = this.dataGrid.layout.getNode('editorContainer');
        if (!cellNode || !editorContainerNode) {
            return;
        }

        const cellRect = getRect(this.scrollArea!, cellNode.element);
        this.dataGrid.layout.updateNode('editorContainer', {
            offset: {
                left: cellRect.left,
                top: cellRect.top,
            },
            size: {
                width: cellRect.width,
                height: cellRect.height,
            },
        });

        editing.set(true);
    };

    private handleDblClick = (event: MouseEvent) => {
        this.startEditing();
        event.stopPropagation();
    };

    private handleScroll = () => {
        this.updateEditorPosition();
    };

    public handleActivate = () => {
        const unwatchNodes = this.dataGrid.layout.layoutNodesState.watchItems(({ item }) => {
            item.element.addEventListener('dblclick', this.handleDblClick);
        });

        this.scrollArea?.addEventListener('scroll', this.handleScroll);

        this.unsubscribes.push(unwatchNodes);
        this.unsubscribes.push(() => {
            this.scrollArea?.removeEventListener('scroll', this.handleScroll);
        });
    };
}
