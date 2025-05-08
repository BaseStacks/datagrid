import { useEffect, useRef } from 'react';
import { type DataGridPlugin, type DataGridPluginConstructor, type DataGridPluginOptions, type RowData } from '../../host';
import type { DataGrid } from '../../dom/DataGrid';

export const usePlugin = <
    TRow extends RowData,
    TOptions extends DataGridPluginOptions,
    TPlugin extends DataGridPlugin<TRow, DataGrid<TRow>, Partial<TOptions>> = DataGridPlugin<TRow, DataGrid<TRow>, Partial<TOptions>>,
>(
        dataGrid: DataGrid<TRow>,
        Plugin: DataGridPluginConstructor<TRow, DataGrid<TRow>, TOptions, TPlugin>,
        options?: TOptions,
    ) => {

    const plugin = useRef<TPlugin>(null);

    useEffect(() => {
        console.log('Adding plugin', Plugin.name);
        
        plugin.current = dataGrid.addPlugin(Plugin, options);

        return () => {
            dataGrid.removePlugin(Plugin);
        };
    }, [Plugin, dataGrid, options]);

    return plugin.current;
};
