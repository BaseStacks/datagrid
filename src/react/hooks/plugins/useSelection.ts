import { useCallback, useEffect, useState } from 'react';
import { SelectionPlugin, type Cell, type RowData } from '../../../core';
import type { UseDataGridReturn } from '../useDataGrid';
import { useStateWatch } from '../atomic/useStateWatch';

interface UseSelectionOptions<TElement extends HTMLElement = HTMLElement> {
    readonly containerRef?: React.RefObject<TElement | null>;
}

export const useSelection = <TRow extends RowData = RowData>(
    dataGrid: UseDataGridReturn<TRow>,
    options: UseSelectionOptions = {}
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

    const activeRect = useStateWatch(selectionPlugin.state.activeRect);
    const selectionRect = useStateWatch(selectionPlugin.state.selectionRect);

    useEffect(() => {
        return () => {
            selectionPlugin.deactivate();
        };
    }, [selectionPlugin]);

    return {
        rect: selectionRect,
        activeRect,
        registerContainer,
        registerCell
    };
};
