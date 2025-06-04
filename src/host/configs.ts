import type { DataGridOptions, RowData } from './types';

export const defaultOptions: Required<DataGridOptions<RowData>> = {
    columnMaxWidth: Infinity,
    columnMinWidth: 120,
    columns: [],
    data: [],
    createRow: () => ({}),
    duplicateRow: ({ rowData }) => ({ ...rowData }),
    disableSmartDelete: false,
    lockRows: false,
    onChange: () => { },
    rowKey: 'id',
    headerHeight: 42,
    rowHeight: 42,
    footerHeight: 42,
};
