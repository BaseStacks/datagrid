import type { CellSelectedRange, CellSelectedRangeWithCells, RowData, RowOperation } from '../types';
import type { DataGridPlugin } from '../atomic/DataGridPlugin';
import { calculateRangeBoundary, getQuadCorners } from '../utils/selectionUtils';
import { DataGridStates } from './DataGridStates';
import type { DataGridHelper } from './DataGridHelper';
import { extractCellId } from '../utils/idUtils';
import type { DataGridHistory } from './DataGridHistory';

export class DataGridModifier<TRow extends RowData = RowData> {
    constructor(
        private state: DataGridStates<TRow>,
        private history: DataGridHistory<TRow>,
        private helper: DataGridHelper<TRow>) {
    }

    public plugins: Map<string, DataGridPlugin<TRow>> = new Map();

    private handleChange = (newData: TRow[], operation: RowOperation) => {
        const { onChange } = this.state.options;
        if (!onChange) {
            return;
        }

        this.history.addUndo(operation);
        onChange(newData, [operation]);
    };

    public updateRowData = (rowIndex: number, item: TRow) => {
        const { data } = this.state.options;
        this.handleChange(
            [
                ...(data?.slice(0, rowIndex) ?? []),
                item,
                ...(data?.slice(rowIndex + 1) ?? []),
            ],
            {
                type: 'UPDATE',
                fromRowIndex: rowIndex,
                toRowIndex: rowIndex,
            }
        );
    };

    public insertRowAfter = (rowIndex: number, count = 1) => {
        const { editing } = this.state;
        const { createRow, data, lockRows } = this.state.options;

        if (lockRows) {
            return;
        }

        editing.set(false);

        const newRows = new Array(count).fill(0).map(() => createRow ? createRow() : {} as TRow);

        this.handleChange(
            [
                ...data.slice(0, rowIndex + 1),
                ...newRows,
                ...data.slice(rowIndex + 1),
            ],
            {
                type: 'CREATE',
                fromRowIndex: rowIndex + 1,
                toRowIndex: rowIndex + 1 + count,
            }
        );
    };

    public duplicateRows = (rowMin: number, rowMax: number = rowMin) => {
        const { duplicateRow, data, lockRows } = this.state.options;
        if (lockRows) {
            return;
        }

        const duplicatedData = data.slice(rowMin, rowMax + 1).map((rowData, i) => duplicateRow ? duplicateRow({ rowData, rowIndex: i + rowMin }) : { ...rowData });

        this.handleChange(
            [
                ...data.slice(0, rowMax + 1),
                ...duplicatedData,
                ...data.slice(rowMax + 1),
            ],
            {
                type: 'CREATE',
                fromRowIndex: rowMax + 1,
                toRowIndex: rowMax + 2 + rowMax - rowMin,
            }
        );
    };

    public deleteRows = (fromRow: number, toRow: number = fromRow) => {
        const { data, lockRows } = this.state.options;

        if (lockRows) {
            return;
        }

        this.handleChange(
            [
                ...data.slice(0, fromRow),
                ...data.slice(toRow + 1),
            ],
            {
                type: 'DELETE',
                fromRowIndex: fromRow,
                toRowIndex: toRow + 1,
            }
        );
    };

    public setRangeData = async (range: CellSelectedRange, rangeData: string[][]) => {
        if (!rangeData.length) {
            return;
        }

        const { columns, data, lockRows } = this.state.options;
        const { min, max } = calculateRangeBoundary(range);

        const results = await Promise.all(
            rangeData[0].map((_, columnIndex) => {
                const column = columns[min.columnIndex + columnIndex];
                const values = rangeData.map((row) => row[columnIndex]);
                return column.prePasteValues?.(values) ?? values;
            })
        );

        rangeData = rangeData.map((_, rowIndex) =>
            results.map((column) => column[rowIndex])
        );

        // Paste single row
        if (rangeData.length === 1) {
            const updatedRows = new Map<number, TRow>();

            for (let columnIndex = 0; columnIndex < rangeData[0].length; columnIndex++) {
                const column = columns[min.columnIndex + columnIndex];
                const pasteValue = column?.pasteValue ?? (({ value }) => value);

                for (let rowIndex = min.rowIndex; rowIndex <= max.rowIndex; rowIndex++) {
                    const isCellDisabled = this.helper.isCellDisabled(rowIndex, columnIndex);
                    if (isCellDisabled) {
                        continue;
                    }

                    const rawValue = rangeData[0][columnIndex];
                    const parsedValue = await pasteValue({
                        value: rawValue
                    });

                    const originRowData = data[rowIndex];
                    const updateRowData = updatedRows.get(rowIndex);

                    updatedRows.set(rowIndex, {
                        ...(updateRowData ?? originRowData),
                        [column.key]: parsedValue,
                    });
                }
            }

            const newData = [
                ...data.slice(0, min.rowIndex),
                ...updatedRows.values(),
                ...data.slice(max.rowIndex + 1),
            ];

            this.handleChange(newData,
                {
                    type: 'UPDATE',
                    fromRowIndex: min.rowIndex,
                    toRowIndex: max.rowIndex,
                });

            return;
        }

        // Paste multiple rows
        const missingRows = min.rowIndex + rangeData.length - data.length;

        if (missingRows > 0 && lockRows) {
            rangeData.splice(rangeData.length - missingRows, missingRows);
        }

        const updatedRows = new Map<number, TRow>();

        for (
            let rangeDataIndex = 0;
            rangeDataIndex < rangeData[0].length;
            rangeDataIndex++
        ) {
            const columnIndex = min.columnIndex + rangeDataIndex;
            const column = columns[columnIndex];
            const pasteValue = column?.pasteValue;

            for (let rowIndex = 0; rowIndex < rangeData.length; rowIndex++) {
                const isCellDisabled = this.helper.isCellDisabled(min.rowIndex + rowIndex, columnIndex);
                if (isCellDisabled) {
                    continue;
                }

                const rawValue = rangeData[rowIndex][rangeDataIndex];
                const parsedValue = pasteValue ? await pasteValue(rawValue) : rawValue;

                const originRowData = data[min.rowIndex + rowIndex];
                const updateRowData = updatedRows.get(min.rowIndex + rowIndex);
                updatedRows.set(min.rowIndex + rowIndex, {
                    ...(updateRowData ?? originRowData),
                    [column.key]: parsedValue,
                });
            }
        }

        const newData = [
            ...data.slice(0, min.rowIndex),
            ...updatedRows.values(),
            ...data.slice(min.rowIndex + rangeData.length),
        ];

        this.handleChange(newData, {
            type: 'UPDATE',
            fromRowIndex: min.rowIndex,
            toRowIndex: min.rowIndex + rangeData.length
        });
    };

    public cloneRangeData = async (source: CellSelectedRangeWithCells, target: CellSelectedRange) => {
        const {
            topLeft: selectedMinCell,
            bottomRight: selectedMaxCell,
        } = getQuadCorners(source.start, source.end);

        const { rowIndex: selectedMinRowIndex, columnIndex: selectedMinColumnIndex } = extractCellId(selectedMinCell);
        const { rowIndex: selectedMaxRowIndex, columnIndex: selectedMaxColumnIndex } = extractCellId(selectedMaxCell);

        const totalRows = selectedMaxRowIndex - selectedMinRowIndex + 1;
        const totalColumns = selectedMaxColumnIndex - selectedMinColumnIndex + 1;

        const {
            topLeft: fillMinCell,
            bottomRight: fillMaxCell,
        } = getQuadCorners(target.start, target.end);

        const { rowIndex: fillMinRowIndex, columnIndex: fillMinColumnIndex } = extractCellId(fillMinCell);
        const { rowIndex: fillMaxRowIndex, columnIndex: fillMaxColumnIndex } = extractCellId(fillMaxCell);

        const fillTotalRows = fillMaxRowIndex - fillMinRowIndex + 1;
        const fillTotalColumns = fillMaxColumnIndex - fillMinColumnIndex + 1;

        const fillData: string[][] = [];
        const selectedData = this.helper.getRangeData(source);

        let copyingRow = 0;
        let copyingColumn = 0;

        for (let fillRow = 0; fillRow < fillTotalRows; ++fillRow) {
            const fillRow: string[] = [];
            const selectedRowData = selectedData[copyingRow];
            for (let fillColumn = 0; fillColumn < fillTotalColumns; ++fillColumn) {
                const cellValue = selectedRowData[copyingColumn];
                fillRow.push(cellValue);
                copyingColumn++;
                if (copyingColumn === totalColumns) {
                    copyingColumn = 0;
                }
            }

            fillData.push(fillRow);

            copyingRow++;
            if (copyingRow === totalRows) {
                copyingRow = 0;
            }
        }

        await this.setRangeData({ start: fillMinCell, end: fillMaxCell, }, fillData);
    };

    public emptyRange = async (range: CellSelectedRangeWithCells) => {
        const { onChange } = this.state.options;
        if (!onChange) {
            return;
        }

        const { min, max } = calculateRangeBoundary(range);
        const totalRows = max.rowIndex - min.rowIndex + 1;
        const totalColumns = max.columnIndex - min.columnIndex + 1;

        const rangeData = new Array(totalRows).fill(0).map(() => new Array(totalColumns).fill(null));
        await this.setRangeData(range, rangeData);
    };
};
