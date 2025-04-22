import type { RowData } from '../../types';
import type { DataGrid } from '../DataGrid';

export interface DataGridPluginOptions {
}

export abstract class DataGridPlugin<TOptions extends DataGridPluginOptions, TRow extends RowData = RowData> {
    public unsubscribes: (() => void)[] = [];
    public active: boolean = false;

    abstract handleActivate: () => void;

    constructor(public dataGrid: DataGrid<TRow>, public options: TOptions) {
    }

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
