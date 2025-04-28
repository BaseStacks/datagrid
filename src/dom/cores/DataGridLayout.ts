import type { CellId, Id, RowData, RowId, HeaderId, HeaderGroupId, RowContainerId, DeepPartial } from '../../host';
import { getIdType, DataGridMapState, DataGridState, DataGridStates } from '../../host';
import { calculateScrollOffsets } from '..';
import type { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';

export interface DataGridLayoutNodeBase {
    readonly element: HTMLElement;
    readonly pinned?: 'left' | 'right' | 'top' | 'bottom';
    readonly size: {
        readonly height: number;
        readonly width: number;
    },
    readonly offset: {
        readonly top?: number;
        readonly left?: number;
    },
    readonly attributes: Record<string, any>;
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

export type DataGridLayoutNode = DataGridCellNode | DataGridHeaderGroupNode | DataGridHeaderNode | DataGridRowNode | DataGridRowContainerNode;

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
            attributes: {},
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

        throw new Error(`Invalid node type: ${type}`);
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
            return;
        }
        return node;
    };

    public calculateCellScrollOffsets = (targetId: CellId) => {
        const scrollArea = this.scrollAreaState.value;
        if (!scrollArea) {
            throw new Error('Scroll area not found');
        }

        const rowNodes = this.getNodesByType<DataGridRowNode>('row') as DataGridRowNode[];
        const topPinnedRows = rowNodes.filter((node) => node.type === 'row' && node.pinned === 'top');
        const bottomPinnedRows = rowNodes.filter((node) => node.type === 'row' && node.pinned === 'bottom');

        const headerNodes = this.getNodesByType<DataGridHeaderNode>('header');
        const leftPinnedColumns = headerNodes.filter((node) => node.type === 'header' && node.pinned === 'left');
        const rightPinnedColumns = headerNodes.filter((node) => node.type === 'header' && node.pinned === 'right');

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

        return calculateScrollOffsets(scrollArea, targetNode.element, viewport);
    };

    public registerAttributes = (plugin: DataGridDomPlugin<TRow>, attributes: string[]) => {
        this.pluginAttributesMap.set(plugin, attributes);
    };

    public updateNode = (plugin: DataGridDomPlugin<TRow>, id: Id, partialNode: DeepPartial<DataGridLayoutNode>) => {
        const node = this.layoutNodesState.get(id);
        if (!node) {
            return;
        }

        const attributes = partialNode.attributes;
        const offset = partialNode.offset;
        const size = partialNode.size;

        let updatedAttributes: Record<string, any> = node.attributes;
        if (attributes) {
            const registerAttributes = this.pluginAttributesMap.get(plugin);

            if (!registerAttributes) {
                throw new Error('Attributes not registered');
            }

            updatedAttributes = registerAttributes.reduce((acc, key) => {
                acc[key] = attributes[key] ?? node.attributes[key] ?? undefined;
                return acc;
            }, {} as Record<string, any>);
        }

        const updatedOffset = {
            ...node.offset,
            ...offset
        };

        const updatedSize = {
            ...node.size,
            ...size
        };

        this.layoutNodesState.replaceItem(id, {
            ...node,
            pinned: partialNode.pinned ?? node.pinned,
            offset: updatedOffset,
            size: updatedSize,
            attributes: updatedAttributes
        });
    };
}
