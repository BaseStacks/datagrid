import React from 'react';
import { DataGridContext } from '../contexts';
import { type RowData } from '../../core';
import { type UseDataGridReturn } from './useDataGrid';

export function useDataGridContext<TRow extends RowData = RowData>() {
    const context = React.useContext<UseDataGridReturn<TRow>>(DataGridContext);

    if (!context) {
        throw new Error('useDataGridContext must be used within a DataGridProvider');
    }

    return context;
};
