import type { DataGridHost } from '../DataGridHost';
import type { RowData } from '../types';

export type DataGridPluginConstructor<
    TRow extends RowData,
    TDataGrid extends DataGridHost<TRow>,
    TOptions,
    TInstance extends DataGridPlugin<TRow, TDataGrid, Partial<TOptions>>> = new (
        dataGrid: DataGridHost<TRow>,
        options: Partial<TOptions>
    ) => TInstance;

export interface DataGridPluginOptions {
}

export abstract class DataGridPlugin<TRow extends RowData, TDataGrid extends DataGridHost<TRow> = DataGridHost<TRow>, TOptions extends DataGridPluginOptions = DataGridPluginOptions> {
    constructor(public dataGrid: TDataGrid, public options: TOptions) {
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
