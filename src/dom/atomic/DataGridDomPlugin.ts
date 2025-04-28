import { DataGridPlugin, type RowData } from '../../host';
import type { DataGrid } from '../DataGrid';

export interface DataGridDomPluginOptions {
}

export abstract class DataGridDomPlugin<
    TRow extends RowData,
    TOptions extends DataGridDomPluginOptions = DataGridDomPluginOptions
> extends DataGridPlugin<TRow, DataGrid<TRow>, TOptions> {
    public get container() {
        return this.dataGrid.layout.containerState.value;
    }

    public get scrollArea() {
        return this.dataGrid.layout.scrollAreaState.value;
    }
};
