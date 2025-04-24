import type { RowData } from '../../types';
import type { DataGrid } from '../DataGrid';

export type DataGridPluginConstructor<TRow extends RowData, TOptions, TInstance extends DataGridPlugin<Partial<TOptions>, TRow>> = new (
    dataGrid: DataGrid<TRow>,
    options: Partial<TOptions>
) => TInstance;

export interface DataGridPluginOptions {
}

export abstract class DataGridPlugin<TOptions extends DataGridPluginOptions = DataGridPluginOptions, TRow extends RowData = RowData> {
    constructor(public dataGrid: DataGrid<TRow>, public options: TOptions) {
    }

    public get container() {
        return this.dataGrid.layout.containerState.value!;
    }

    public get scrollArea() {
        return this.dataGrid.layout.scrollAreaState.value!;
    }

    public unsubscribes: (() => void)[] = [];
    public active: boolean = false;

    public abstract handleActivate: () => void;

    public activate = (_opts?: TOptions) => {
        this.active = true;
        this.handleActivate();
    };

    public deactivate = () => {
        if (!this.active) {
            return;
        }

        this.unsubscribes.forEach(unsubscribe => unsubscribe());
        this.unsubscribes = [];

        this.active = false;
    };
};
