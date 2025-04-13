import { useEffect, useState } from 'react';
import { DataGrid, KeybindingPlugin, KeybindingPluginOptions, RowData } from '../../../core';

export const useKeyBindings = <TRow extends RowData = RowData>(
    dataGrid: DataGrid<TRow>,
    options: KeybindingPluginOptions = {}
) => {
    const [keybindingPlugin] = useState(() => new KeybindingPlugin(dataGrid));

    const { keyMap } = options;

    useEffect(() => {
        keybindingPlugin.activate({ keyMap });

        return () => {
            keybindingPlugin.deactivate();
        };
    }, [keybindingPlugin, keyMap]);

    return {};
};
