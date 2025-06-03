import type { Column, RowData } from '../types';
import { setAsClone } from './objectUtils';

export const updateRowData = <TRow extends RowData>(options: {
    data: TRow[],
    columns: Column[],
    rowIndex: number,
    columnIndex: number,
    cellValue: any
}) => {
    const { data, columns, rowIndex, columnIndex, cellValue } = options;

    const rowData = data[rowIndex];
    const column = columns[columnIndex];
    const dataKey = column.dataKey ?? column.key;
    if (!dataKey) {
        throw new Error(`Column at index ${columnIndex} does not have a dataKey.`);
    }

    const updatedRow = setAsClone(rowData, dataKey, cellValue);
    return updatedRow;
};
