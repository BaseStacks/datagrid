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
    rowKey: () => { throw new Error('Row key is not defined. Please provide a row key function.'); },
    headerHeight: 42,
    rowHeight: 42
};
