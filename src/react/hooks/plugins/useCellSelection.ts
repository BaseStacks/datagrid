import { CellSelectionPlugin, type RowData } from '../../../core';
import type { UseDataGridReturn } from '../useDataGrid';
import { useStateWatch } from '../atomic/useStateWatch';
import { usePlugin } from '../usePlugin';

export const useCellSelection = <TRow extends RowData = RowData>(
    dataGrid: UseDataGridReturn<TRow>,
) => {
    const cellSelection = usePlugin(dataGrid, CellSelectionPlugin, {});

    const activeRect = useStateWatch(cellSelection.state.activeCellRect);
    const areaRects = useStateWatch(cellSelection.state.selectedAreaRects);
    const dragging = useStateWatch(cellSelection.state.dragging);

    return {
        areaRects,
        activeRect,
        dragging
    };
};
