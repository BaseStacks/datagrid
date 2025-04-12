import { useEffect, useMemo, useRef } from 'react';
import type { DataGridOptions, RowData } from '../../core';
import { DataGridStates, DataGridController, DataGridSelection } from '../../core';

export type UseDataGridReturn<TRow extends RowData> = ReturnType<typeof useDataGrid<TRow>>;

export const useDataGrid = <TRow extends RowData>(options: DataGridOptions<TRow>) => {
    const dataGridStates = useRef<DataGridStates<TRow>>(null);
    dataGridStates.current = dataGridStates.current ?? new DataGridStates<TRow>(options);

    const dataGridController = useRef<DataGridController<TRow>>(null);
    dataGridController.current = dataGridController.current ?? new DataGridController<TRow>(dataGridStates.current);

    const dataGridSelection = useRef<DataGridSelection<TRow>>(null);
    dataGridSelection.current = dataGridSelection.current ?? new DataGridSelection<TRow>(dataGridStates.current);

    const dataGrid = useMemo(() => {
        return {
            ...dataGridController.current!,
            ...dataGridSelection.current!,
            state: dataGridStates.current!,
        };
    }, []);

    useEffect(() => {
        dataGridStates.current!.updateOptions(options);
    }, [options]);

    return dataGrid;
};
