import { CellSelectionPlugin, type RowData } from '../../../core';
import type { UseDataGridReturn } from '../useDataGrid';
import { useDataGridState } from '../atomic/useDataGridState';
import { usePlugin } from '../usePlugin';

export type UseCellSelectionReturn = ReturnType<typeof useCellSelection>;

export const useCellSelection = <TRow extends RowData = RowData>(
    dataGrid: UseDataGridReturn<TRow>,
) => {
    const cellSelection = usePlugin(dataGrid, CellSelectionPlugin, {});

    const activeRect = useDataGridState(cellSelection.state.activeCellRect);
    const rangeRects = useDataGridState(cellSelection.state.selectedRangeRects);
    const dragging = useDataGridState(cellSelection.state.dragging);

    return {
        rangeRects,
        activeRect,
        dragging
    };
};
