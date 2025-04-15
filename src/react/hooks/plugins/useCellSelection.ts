import { useCallback, useEffect, useState } from 'react';
import { CellSelectionPlugin, type Cell, type RowData } from '../../../core';
import type { UseDataGridReturn } from '../useDataGrid';
import { useStateWatch } from '../atomic/useStateWatch';

export const useCellSelection = <TRow extends RowData = RowData>(
    dataGrid: UseDataGridReturn<TRow>,
) => {
    const [cellSelection] = useState(() => new CellSelectionPlugin(dataGrid));

    const registerContainer = useCallback((container: HTMLElement | null) => {
        if (!container) {
            cellSelection.deactivate();
            return;
        }

        if (!cellSelection.isActive) {
            cellSelection.active({ container });
        }
        else {
            cellSelection.reActivate({ container });
        }
    }, [cellSelection]);

    const registerCell = useCallback((cell: Cell) => (element: HTMLElement | null) => {
        cellSelection.registerCell(cell.coordinates, element);
    }, [cellSelection]);

    const activeRect = useStateWatch(cellSelection.state.activeCellRect);
    const areaRects = useStateWatch(cellSelection.state.selectedAreaRects);
    const dragging = useStateWatch(cellSelection.state.dragging);

    useEffect(() => {
        return () => {
            cellSelection.deactivate();
        };
    }, [cellSelection]);

    return {
        areaRects,
        activeRect,
        dragging,
        registerContainer,
        registerCell
    };
};
