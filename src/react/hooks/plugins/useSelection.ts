import { useCallback, useEffect, useState } from 'react';
import { SelectionPlugin, type Cell, type RowData } from '../../../core';
import type { UseDataGridReturn } from '../useDataGrid';
import { useStateWatch } from '../atomic/useStateWatch';

export const useSelection = <TRow extends RowData = RowData>(
    dataGrid: UseDataGridReturn<TRow>,
) => {
    const [selectionPlugin] = useState(() => new SelectionPlugin(dataGrid));

    const registerContainer = useCallback((container: HTMLElement | null) => {
        if (!container) {
            selectionPlugin.deactivate();
            return;
        }

        if (!selectionPlugin.isActive) {
            selectionPlugin.active({ container });
        }
        else {
            selectionPlugin.reActivate({ container });
        }
    }, [selectionPlugin]);

    const registerCell = useCallback((cell: Cell) => (element: HTMLElement | null) => {
        selectionPlugin.registerCell(cell.coordinates, element);
    }, [selectionPlugin]);

    const activeRect = useStateWatch(selectionPlugin.state.activeCellRect);
    const areaRect = useStateWatch(selectionPlugin.state.selectedAreaRect);

    useEffect(() => {
        return () => {
            selectionPlugin.deactivate();
        };
    }, [selectionPlugin]);

    return {
        areaRect,
        activeRect,
        registerContainer,
        registerCell
    };
};
