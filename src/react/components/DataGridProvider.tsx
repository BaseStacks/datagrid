import React from 'react';
import { DataGridContext } from '../contexts';
import { UseDataGridReturn } from '../hooks/useDataGrid';
import { RowData } from '../../core';

interface DataGridProviderProps<TRow extends RowData> {
    readonly dataGrid: UseDataGridReturn<TRow>;
}

export function DataGridProvider<TRow extends RowData>({ children, dataGrid }: React.PropsWithChildren<DataGridProviderProps<TRow>>) {
    return (
        <DataGridContext.Provider value={dataGrid}>
            {children}
        </DataGridContext.Provider>
    );
}
