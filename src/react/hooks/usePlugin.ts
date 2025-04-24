import { useEffect, useRef } from 'react';
import { DataGrid, type DataGridPlugin, type DataGridPluginConstructor, type DataGridPluginOptions, type RowData } from '../../core';

export const usePlugin = <
    TRow extends RowData,
    TOptions extends DataGridPluginOptions,
    TPlugin extends DataGridPlugin<Partial<TOptions>, TRow> = DataGridPlugin<Partial<TOptions>, TRow>,
>(
        dataGrid: DataGrid<TRow>,
        Plugin: DataGridPluginConstructor<TRow, TOptions, TPlugin>,
        options?: TOptions,
    ) => {

    const plugin = useRef<TPlugin>(null);

    useEffect(() => {
        plugin.current = dataGrid.addPlugin(Plugin, options);

        return () => {
            dataGrid.removePlugin(Plugin);
        };
    }, [Plugin, dataGrid, options]);

    return plugin.current;
};
