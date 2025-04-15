import { useEffect, useRef, useState } from 'react';
import { DataGrid, deepEqual, type DataGridPlugin, type DataGridPluginOptions } from '../../core';

export const usePlugin = <TOptions extends DataGridPluginOptions>(
    dataGrid: DataGrid,
    Plugin: DataGridPlugin<TOptions>,
    options: TOptions
) => {
    const previousOptions = useRef<TOptions | null>(null);
    const [plugin] = useState(() => new Plugin(dataGrid, options));

    useEffect(() => {
        const isOptionsChanged = deepEqual(previousOptions.current, options);
        if (isOptionsChanged) {
            return;
        }

        previousOptions.current = options;
        plugin.activate(options);

        return () => {
            plugin.deactivate();
        };
    }, [plugin, options]);

    return plugin;
};
