import React from 'react';
import type { UseDataGridReturn } from './hooks/useDataGrid';

export const DataGridContext = React.createContext<UseDataGridReturn<any>>(null!);
