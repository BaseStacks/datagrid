import type { CellSelectedRangeWithCells, RowData, RowOperation } from '../types';
import type { DataGridPlugin } from '../atomic/DataGridPlugin';
import { calculateRangeBoundary } from '../utils/selectionUtils';
import { DataGridStates } from './DataGridStates';
import type { DataGridHelper } from './DataGridHelper';

export class DataGridModifier<TRow extends RowData = RowData> {
    constructor(private state: DataGridStates<TRow>, private helper: DataGridHelper<TRow>) {
    }

    public plugins: Map<string, DataGridPlugin<TRow>> = new Map();
    public updateData = (rowIndex: number, item: TRow) => {
        const { onChange, data } = this.state.options;
        onChange?.(
            [
                ...(data?.slice(0, rowIndex) ?? []),
                item,
                ...(data?.slice(rowIndex + 1) ?? []),
            ],
            [
                {
                    type: 'UPDATE',
                    fromRowIndex: rowIndex,
                    toRowIndex: rowIndex + 1,
                },
            ]
        );
    };

    public deleteSelection = () => {
        const { activeCell, selectedRanges } = this.state;
        const { onChange, columns, data } = this.state.options;
        if (!onChange) {
            return;
        }

        if (!activeCell.value) {
            return;
        }

        const newData = [...data];
        const operations: RowOperation[] = [];

        for (const selectedRange of selectedRanges.value) {
            const { min, max } = calculateRangeBoundary(selectedRange);

            for (let row = min.rowIndex; row <= max.rowIndex; ++row) {
                const modifiedRowData = { ...newData[row] };

                for (let col = min.columnIndex; col <= max.columnIndex; ++col) {
                    const column = columns[col];
                    if (!column.key) {
                        continue;
                    }

                    const cellDisabled = this.helper.isCellDisabled(row, col);
                    if (cellDisabled) {
                        continue;
                    }

                    delete modifiedRowData[column.key];
                }

                newData[row] = modifiedRowData;
            }

            operations.push({
                type: 'UPDATE',
                fromRowIndex: min.rowIndex,
                toRowIndex: max.rowIndex + 1,
            });
        }

        onChange(newData, operations);
    };

    public insertRowAfter = (rowIndex: number, count = 1) => {
        const { editing } = this.state;
        const { createRow, onChange, data, lockRows } = this.state.options;

        if (lockRows) {
            return;
        }

        editing.set(false);

        const newRows = new Array(count).fill(0).map(() => createRow ? createRow() : {} as TRow);

        onChange?.(
            [
                ...data.slice(0, rowIndex + 1),
                ...newRows,
                ...data.slice(rowIndex + 1),
            ],
            [{
                type: 'CREATE',
                fromRowIndex: rowIndex + 1,
                toRowIndex: rowIndex + 1 + count,
            }]
        );
    };

    public duplicateRows = (rowMin: number, rowMax: number = rowMin) => {
        const { onChange, duplicateRow, data, lockRows } = this.state.options;
        if (lockRows) {
            return;
        }

        const duplicatedData = data.slice(rowMin, rowMax + 1).map((rowData, i) => duplicateRow ? duplicateRow({ rowData, rowIndex: i + rowMin }) : { ...rowData });

        onChange?.(
            [
                ...data.slice(0, rowMax + 1),
                ...duplicatedData,
                ...data.slice(rowMax + 1),
            ],
            [{
                type: 'CREATE',
                fromRowIndex: rowMax + 1,
                toRowIndex: rowMax + 2 + rowMax - rowMin,
            }]
        );
    };

    public deleteRows = (fromRow: number, toRow: number = fromRow) => {
        const { onChange, data, lockRows } = this.state.options;

        if (lockRows) {
            return;
        }

        onChange?.(
            [
                ...data.slice(0, fromRow),
                ...data.slice(toRow + 1),
            ],
            [
                {
                    type: 'DELETE',
                    fromRowIndex: fromRow,
                    toRowIndex: toRow + 1,
                },
            ]
        );
    };

    public setRangeData = async (range: CellSelectedRangeWithCells, rangeData: string[][]) => {
        if (!rangeData.length) {
            return;
        }

        const { createRow, onChange, columns, data, lockRows } = this.state.options;
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
            const newData = [...data];

            for (let columnIndex = 0; columnIndex < rangeData[0].length; columnIndex++) {
                const column = columns[min.columnIndex + columnIndex];
                const pasteValue = column?.pasteValue;

                if (!pasteValue) {
                    continue;
                }

                for (let rowIndex = min.rowIndex; rowIndex <= max.rowIndex; rowIndex++) {
                    if (!this.helper.isCellDisabled(rowIndex, columnIndex + min.columnIndex)) {
                        newData[rowIndex] =
                            pasteValue
                                ? await pasteValue({
                                    rowData: newData[rowIndex],
                                    value: rangeData[0][columnIndex],
                                    rowIndex,
                                })
                                : rangeData[0][columnIndex];
                    }
                }
            }

            onChange?.(newData, [
                {
                    type: 'UPDATE',
                    fromRowIndex: min.rowIndex,
                    toRowIndex: max.rowIndex + 1,
                },
            ]);

            return;
        }

        // Paste multiple rows
        let newData = [...data];
        const missingRows = min.rowIndex + rangeData.length - data.length;

        if (missingRows > 0) {
            if (!lockRows) {
                const newRowData = new Array(missingRows).fill(0).map(() => createRow ? createRow() : {} as TRow);
                newData = [...newData, ...newRowData];
            } else {
                rangeData.splice(rangeData.length - missingRows, missingRows);
            }
        }

        for (
            let columnIndex = min.columnIndex;
            (columnIndex < rangeData[0].length) && (columnIndex < columns.length - 1);
            columnIndex++
        ) {
            const pasteValue = columns[columnIndex]?.pasteValue;

            if (pasteValue) {
                for (let rowIndex = 0; rowIndex < rangeData.length; rowIndex++) {
                    const isCellDisabled = this.helper.isCellDisabled(min.rowIndex + rowIndex, columnIndex);
                    if (isCellDisabled) {
                        continue;
                    }

                    newData[min.rowIndex + rowIndex] = await pasteValue({
                        rowData: newData[min.rowIndex + rowIndex],
                        value: rangeData[rowIndex][columnIndex],
                        rowIndex: min.rowIndex + rowIndex,
                    });
                }
            }
        }

        const operations: RowOperation[] = [
            {
                type: 'UPDATE',
                fromRowIndex: min.rowIndex,
                toRowIndex:
                    min.rowIndex +
                    rangeData.length -
                    (!lockRows && missingRows > 0 ? missingRows : 0),
            },
        ];

        if (missingRows > 0 && !lockRows) {
            operations.push({
                type: 'CREATE',
                fromRowIndex: min.rowIndex + rangeData.length - missingRows,
                toRowIndex: min.rowIndex + rangeData.length,
            });
        }

        onChange?.(newData, operations);
    };

    public emptyRange = (range: CellSelectedRangeWithCells) => {
        const { onChange } = this.state.options;
        if (!onChange) {
            return;
        }

        const { min, max } = calculateRangeBoundary(range);
        const totalRows = max.rowIndex - min.rowIndex + 1;
        const totalColumns = max.columnIndex - min.columnIndex + 1;

        const rangeData = new Array(totalRows).fill(0).map(() => new Array(totalColumns).fill(null));
        this.setRangeData(range, rangeData);
    };
};
