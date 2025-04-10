import { useMemo, useRef } from 'react';
import type { DataGridProps, RowData } from '../../core';
import { DataGridStates, DataGridController, DataGridSelection } from '../../core';

export const useDataGrid = <TRow extends RowData>(props: DataGridProps<TRow>) => {
    const dataGridStates = useRef<DataGridStates<TRow>>(null);
    dataGridStates.current = dataGridStates.current ?? new DataGridStates<TRow>(props);

    const dataGridController = useRef<DataGridController<TRow>>(null);
    dataGridController.current = dataGridController.current ?? new DataGridController<TRow>(dataGridStates.current);

    const dataGridSelection = useRef<DataGridSelection<TRow>>(null);
    dataGridSelection.current = dataGridSelection.current ?? new DataGridSelection<TRow>(dataGridStates.current);

    const dataGrid = useMemo(() => {
        return {
            ...dataGridStates.current!,
            ...dataGridController.current!,
            ...dataGridSelection.current!,
        };
    }, []);

    return dataGrid;
};
