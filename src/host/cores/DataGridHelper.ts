import type { CellSelectedRangeWithCells, RowData } from '../types';
import { extractCellId } from '../utils/idUtils';
import type { DataGridStates } from './DataGridStates';


export class DataGridHelper<TRow extends RowData> {
    constructor(private state: DataGridStates<TRow>) {
    }

    public isCellDisabled = (rowIndex: number, columnIndex: number) => {
        const { columns } = this.state.options;

        const column = columns[columnIndex];
        if (column) {
            const disabled = column.disabled;
            return typeof disabled === 'function' ? disabled({ value: {}, rowIndex }) : disabled;
        }
        return false;
    };

    public getRangeData = (range: CellSelectedRangeWithCells) => {
        const rowDataMap = new Map<number, string[]>();

        for (const [cellId] of range.cells) {
            const { rowIndex, columnIndex } = extractCellId(cellId);

            const rowData = rowDataMap.get(rowIndex) ?? [];
            const column = this.state.headers.value[columnIndex]?.column;
            const cellData = this.state.options.data[rowIndex][column.key];
            rowData[columnIndex] = cellData ?? null;

            rowDataMap.set(rowIndex, rowData);
        }

        const rangeData: string[][] = [];
        for (const rowData of rowDataMap.values()) {
            rangeData.push(rowData.filter((cellData) => cellData !== undefined));
        }

        return rangeData;
    };
};
