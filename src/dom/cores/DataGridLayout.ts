import type { CellId, Id, RowData, RowId, HeaderId, HeaderGroupId, RowContainerId, DeepPartial, EditorContainerId, FillHandleId } from '../../host';
import { getIdType, DataGridMapState, DataGridState, DataGridStates } from '../../host';
import { calculateScrollOffsets } from '..';
import type { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';

export interface DataGridLayoutNodeBase {
    readonly element: HTMLElement;
    readonly visible?: boolean;
    readonly pinned?: {
        readonly side?: 'top' | 'bottom' | 'left' | 'right' | 'all';
        readonly first?: boolean;
        readonly last?: boolean;
    }
    readonly size: {
        readonly height: number;
        readonly width: number;
    },
    readonly offset: {
        readonly top?: number;
        readonly left?: number;
    },
}

export interface DataGridCellNode extends DataGridLayoutNodeBase {
    readonly id: CellId;
    readonly type: 'cell',
    readonly rowId: RowId;
    readonly headerId: HeaderId;
    readonly active?: boolean;
    readonly focused?: boolean;
}

export interface DataGridHeaderNode extends DataGridLayoutNodeBase {
    readonly id: HeaderId;
    readonly type: 'header',
}

export interface DataGridRowNode extends DataGridLayoutNodeBase {
    readonly id: RowId;
    readonly type: 'row',
}

export interface DataGridHeaderGroupNode extends DataGridLayoutNodeBase {
    readonly id: HeaderGroupId;
    readonly type: 'headerGroup',
}

export interface DataGridRowContainerNode extends DataGridLayoutNodeBase {
    readonly id: RowContainerId;
    readonly type: 'rowContainer';
}

export interface DataGridEditorContainerNode extends DataGridLayoutNodeBase {
    readonly id: EditorContainerId;
    readonly type: 'editorContainer';
}

export interface DataGridFillHandleNode extends DataGridLayoutNodeBase {
    readonly id: FillHandleId;
    readonly type: 'editorContainer';
}

export type DataGridLayoutNode = DataGridCellNode | DataGridHeaderGroupNode | DataGridHeaderNode | DataGridRowNode | DataGridRowContainerNode | DataGridEditorContainerNode | DataGridFillHandleNode;

export class DataGridLayout<TRow extends RowData> {
    constructor(private state: DataGridStates<TRow>) { }

    private getNodesByType = <TType extends DataGridLayoutNode>(type: TType['type']) => {
        return this.layoutNodesState.values().filter((node) => node.type === type).toArray() as TType[];
    };

    public get scrollbarWidth() {
        if (!this.scrollAreaState.value) {
            return 0;
        }
        const scrollArea = this.scrollAreaState.value;
        return scrollArea.offsetWidth - scrollArea.clientWidth;
    }

    public containerState = new DataGridState<HTMLElement | null>(null);
    public scrollAreaState = new DataGridState<HTMLElement | null>(null);
    public layoutNodesState = new DataGridMapState<Id, DataGridLayoutNode>(new Map(), { useDeepEqual: false });
    public pluginAttributesMap = new Map<DataGridDomPlugin<TRow>, string[]>();

    /**
     * Register the container to the layout
     * @param newContainer
     */
    public registerContainer = (newContainer: HTMLElement) => {
        if (!newContainer) {
            return;
        }

        if (this.containerState.value) {
            throw new Error('Container already registered');
        }

        this.containerState.set(newContainer);
    };

    /**
     * Remove the container from the layout
     * @param container 
     */
    public removeContainer = (container: HTMLElement) => {
        if (!this.containerState.value) {
            throw new Error('Container not registered');
        }

        if (container !== this.containerState.value) {
            throw new Error('Container mismatch');
        }

        this.containerState.set(null);
    };

    public registerScrollArea = (scrollArea: HTMLElement) => {
        if (!scrollArea) {
            return;
        }

        if (this.scrollAreaState.value) {
            throw new Error('Container already registered');
        }

        this.scrollAreaState.set(scrollArea);
    };

    public removeScrollArea = (scrollArea: HTMLElement) => {
        if (!this.scrollAreaState.value) {
            throw new Error('Container not registered');
        }

        if (scrollArea !== this.scrollAreaState.value) {
            throw new Error('Container mismatch');
        }

        this.scrollAreaState.set(null);
    };

    /**
     * Register the element to the layout
     * @param id
     * @param element
     */
    public registerNode = (id: Id, element: HTMLElement) => {
        const existingNode = this.getNode(id);

        if (existingNode) {
            return;
        }

        const type = getIdType(id);

        const nodeBase = {
            visible: true,
            element,
            size: {
                height: element.clientHeight,
                width: element.clientWidth
            },
            offset: {
                top: element.offsetTop,
                left: element.offsetLeft,
            }
        };

        if (type === 'cell') {
            const cellId = id as CellId;
            const row = this.state.rows.value.find((row) => row.cells.some((cell) => cell.id === cellId));
            if (!row) {
                throw new Error(`Row not found for cell id: ${cellId}`);
            }

            const cell = row.cells.find((cell) => cell.id === cellId);
            if (!cell) {
                throw new Error(`Cell not found for cell id: ${cellId}`);
            }

            this.layoutNodesState.addItem(cellId, {
                ...nodeBase,
                id: id as CellId,
                type: 'cell',
                rowId: cell.rowId,
                headerId: cell.headerId
            });
            return;
        };

        if (type === 'header') {
            const headerId = id as HeaderId;
            this.layoutNodesState.addItem(headerId, {
                ...nodeBase,
                id: id as HeaderId,
                type
            });
            return;
        }

        if (type === 'row') {
            const rowId = id as RowId;
            this.layoutNodesState.addItem(rowId, {
                ...nodeBase,
                id: id as RowId,
                type,
            });
            return;
        }

        if (type === 'headerGroup') {
            const headerGroupId = id as HeaderGroupId;
            this.layoutNodesState.addItem(headerGroupId, {
                ...nodeBase,
                id: headerGroupId,
                type,
            });
            return;
        }

        if (type === 'rowContainer') {
            const rowContainerId = id as RowContainerId;
            this.layoutNodesState.addItem(rowContainerId, {
                ...nodeBase,
                id: rowContainerId,
                type,
            });
            return;
        }

        if (type === 'editorContainer') {
            const editorContainerId = id as EditorContainerId;
            this.layoutNodesState.addItem(editorContainerId, {
                ...nodeBase,
                id: editorContainerId,
                type,
            });
            return;
        }

        if (type === 'fillHandle') {
            const fillHandleId = id as FillHandleId;
            this.layoutNodesState.addItem(fillHandleId, {
                ...nodeBase,
                id: fillHandleId,
                type,
            });
            return;
        }

        this.layoutNodesState.addItem(id, {
            ...nodeBase,
            id,
            type,
        } as any);
    };

    /**
     * Remove the element from the layout
     * @param id 
     */
    public removeNode = (id: Id) => {
        this.layoutNodesState.removeItem(id);
    };

    public getNodeByElement = (element: HTMLElement) => {
        const registeredNode = this.layoutNodesState.values().find((node) => node.element === element);
        return registeredNode;
    };

    public getNode = (id: Id) => {
        const node = this.layoutNodesState.get(id);
        if (!node) {
            return null;
        }

        return node;
    };

    public calculateCellScrollOffsets = (targetId: CellId) => {
        const scrollArea = this.scrollAreaState.value;
        if (!scrollArea) {
            throw new Error('Scroll area not found');
        }

        const rowNodes = this.getNodesByType<DataGridRowNode>('row') as DataGridRowNode[];
        const topPinnedRows = rowNodes.filter((node) => node.type === 'row' && node.pinned?.side === 'top');
        const bottomPinnedRows = rowNodes.filter((node) => node.type === 'row' && node.pinned?.side === 'bottom');

        const headerNodes = this.getNodesByType<DataGridHeaderNode>('header');
        const leftPinnedColumns = headerNodes.filter((node) => node.type === 'header' && node.pinned?.side === 'left');
        const rightPinnedColumns = headerNodes.filter((node) => node.type === 'header' && node.pinned?.side === 'right');

        const topHeight = topPinnedRows.reduce((acc, node) => acc + node.size.height!, 0);
        const bottomHeight = bottomPinnedRows.reduce((acc, node) => acc + node.size.height!, 0);
        const leftWidth = leftPinnedColumns.reduce((acc, node) => acc + node.size.width, 0);
        const rightWidth = rightPinnedColumns.reduce((acc, node) => acc + node.size.width, 0);

        const centerWidth = scrollArea.clientWidth - leftWidth - rightWidth;
        const viewport = {
            left: leftWidth,
            right: leftWidth + centerWidth,
            top: topHeight,
            bottom: scrollArea.clientHeight - bottomHeight,
        };

        const targetNode = this.getNode(targetId);
        if (!targetNode) {
            throw new Error('Node not found');
        }

        return calculateScrollOffsets(targetNode.element, scrollArea, viewport);
    };

    public updateNode = (id: Id, partialNode: DeepPartial<DataGridLayoutNode>) => {
        const node = this.layoutNodesState.get(id);
        if (!node) {
            return;
        }

        const offset = {
            ...node.offset,
            ...partialNode.offset
        };

        const size = {
            ...node.size,
            ...partialNode.size
        };

        this.layoutNodesState.replaceItem(id, {
            ...node,
            visible: partialNode.visible ?? node.visible,
            pinned: {
                ...node.pinned,
                ...partialNode.pinned
            },
            offset,
            size
        });
    };
}
