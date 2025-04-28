import { DataGridHost, DataGridPlugin, type DataGridOptions, type DataGridPluginConstructor, type DataGridPluginOptions, type RowData } from '../host';
import { DataGridKeyBindings } from './cores/DataGridKeyBindings';
import { DataGridLayout } from './cores/DataGridLayout';

export class DataGrid<TRow extends RowData = RowData> extends DataGridHost<TRow> {
    constructor(options: DataGridOptions<TRow>) {
        super(options);
        this.layout = new DataGridLayout(this.state);
        this.keyBindings = new DataGridKeyBindings(this.state, this.events);
    }

    public layout: DataGridLayout<TRow>;
    public keyBindings: DataGridKeyBindings<TRow>;

    public addPlugin = <
        TOptions extends DataGridPluginOptions,
        TPlugin extends DataGridPlugin<TRow, DataGrid<TRow>, Partial<TOptions>>>(
        PluginClass: DataGridPluginConstructor<TRow, DataGrid<TRow>, TOptions, TPlugin>,
        options?: Partial<TOptions>
    ) => {
        const existingPlugin = this.plugins.get(PluginClass.name);

        if (existingPlugin) {
            return existingPlugin as TPlugin;
        }

        const newPlugin = new PluginClass(this, options ?? {});
        this.plugins.set(PluginClass.name, newPlugin);
        newPlugin.activate();
        return newPlugin;
    };

    public removePlugin = (PluginClass: new (dataGrid: this, options: Partial<DataGridPluginOptions>) => DataGridPlugin<TRow>) => {
        const existingPlugin = this.plugins.get(PluginClass.name);

        if (!existingPlugin) {
            throw new Error(`Plugin ${PluginClass.name} does not exist.`);
        }

        existingPlugin.deactivate();
        this.plugins.delete(PluginClass.name);
    };
}
