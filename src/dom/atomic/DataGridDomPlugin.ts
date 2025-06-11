import { DataGridPlugin, type RowData } from '../../host';
import type { DataGrid } from '../DataGrid';

export interface DataGridDomPluginOptions {
}

export abstract class DataGridDomPlugin<
    TRow extends RowData,
    TOptions extends DataGridDomPluginOptions = DataGridDomPluginOptions
> extends DataGridPlugin<TRow, DataGrid<TRow>, TOptions> {
    private readonly _nodeCleanup: Map<HTMLElement, Map<string, () => void>> = new Map();

    private readonly cleanupNodes = () => {
        this._nodeCleanup.forEach((cleanup) => {
            cleanup.forEach(fn => fn());
        });
    };

    constructor(dataGrid: DataGrid<TRow>, options: TOptions) {
        super(dataGrid, options);
        this.unsubscribes.push(this.cleanupNodes);
    }

    public get container() {
        return this.dataGrid.layout.containerState.value;
    }

    public get scrollArea() {
        return this.dataGrid.layout.scrollAreaState.value;
    }

    public addEventListener = <TElement extends HTMLElement, TEvent extends keyof HTMLElementEventMap>(
        node: TElement,
        event: TEvent,
        listener: (ev: HTMLElementEventMap[TEvent]) => any
    ) => {
        if (!this._nodeCleanup.has(node)) {
            this._nodeCleanup.set(node, new Map());
        }

        const cleanupMap = this._nodeCleanup.get(node)!;

        node.addEventListener(event, listener);
        cleanupMap.set(event, () => node.removeEventListener(event, listener));
    };

    public removeEventListener = <TElement extends HTMLElement, TEvent extends keyof HTMLElementEventMap>(
        node: TElement,
        event: TEvent,
        listener: (ev: HTMLElementEventMap[TEvent]) => any
    ) => {
        if (!this._nodeCleanup.has(node)) {
            throw new Error('No cleanup function found for the node.');
        }

        const cleanupMap = this._nodeCleanup.get(node)!;

        node.removeEventListener(event, listener);

        cleanupMap.get(event)!();
        cleanupMap.delete(event);
    };
};
