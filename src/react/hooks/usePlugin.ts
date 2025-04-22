import { useEffect, useRef, useState } from 'react';
import { DataGrid, deepEqual, type DataGridPlugin, type DataGridPluginOptions, type RowData } from '../../core';

const useDeepEqualState = <T>(value: T) => {
    const [state, setState] = useState(value);
    const previousValue = useRef(value);
    useEffect(() => {
        if (!deepEqual(previousValue.current, value)) {
            setState(value);
        }
        previousValue.current = value;
    }, [value]);
    return [state, setState] as const;
};

export const usePlugin = <
    TRow extends RowData,
    TOptions extends DataGridPluginOptions
>(
        dataGrid: DataGrid<TRow>,
        Plugin: new (dataGrid: DataGrid<TRow>) => DataGridPlugin<TOptions>,
        options?: TOptions,
    ) => {
    const [pluginOptions] = useDeepEqualState(options);

    const plugin = useRef(new Plugin(dataGrid));

    useEffect(() => {
        if (!plugin.current) {
            plugin.current = new Plugin(dataGrid);
        }

        plugin.current!.activate(pluginOptions);

        return () => {
            plugin.current!.deactivate();
        };
    }, [Plugin, dataGrid, pluginOptions]);

    return plugin.current;
};
