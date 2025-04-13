import type { CellCoordinates, CellProps, Column, ColumnHeader, DataGridOptions, Row, RowData, RowOperation } from '../types';
import { getCellId } from '../utils/cellUtils';
import { updateRowData } from '../utils/rowUtils';
import { DataGridSelection } from './DataGridSelection';
import { DataGridStates } from './DataGridStates';

export class DataGrid<TRow extends RowData = RowData> {
    private createHeaders = (): ColumnHeader[] => {
        const { columns } = this.options;
        return columns.map((column, index) => ({
            index,
            column,
            render: () => typeof column.header === 'function' ? column.header() : column.header,
        }));
    };

    private createRows = (data: TRow[], columns: Column[]): Row<TRow>[] => {
        return data.map((newRowData, rowIndex) => {
            const oldRow = this.state.rows.value[rowIndex];
            if (oldRow?.data === newRowData) {
                return oldRow;
            }

            return {
                index: rowIndex,
                data: newRowData,
                cells: columns.map((column, columnIndex) => {
                    const cellInfo = {
                        id: getCellId(rowIndex, columnIndex),
                        coordinates: {
                            row: rowIndex,
                            col: columnIndex,
                        }
                    };

                    const cellValue = newRowData[column.dataKey as keyof TRow] ?? null;

                    const renderProps: CellProps = {
                        ...cellInfo,
                        value: cellValue,
                        active: false,
                        focused: false,
                        disabled: false,
                        blur: this.selection.blur,
                        setValue: (nextValue) => {
                            if (!this.options.onChange) {
                                return;
                            }

                            const newRowData = updateRowData({
                                data: this.options.data,
                                columns: this.options.columns,
                                rowIndex,
                                columnIndex,
                                cellValue: nextValue,
                            });

                            this.updateData(rowIndex, newRowData);
                        },
                        onFocus: (callback) => {
                            return this.state.editing.watch((editing) => {
                                const activeCell = this.state.activeCell.value;
                                const isEditing = editing && activeCell?.row === rowIndex && activeCell?.col === columnIndex;
                                if (isEditing) {
                                    callback();
                                }
                            });
                        },
                        onBlur: (callback) => {
                            return this.state.activeCell.watch((activeCell) => {
                                const isEditing = this.state.editing.value && activeCell?.row === rowIndex && activeCell?.col === columnIndex;
                                if (!isEditing) {
                                    callback();
                                }
                            });
                        },
                    };

                    return {
                        ...cellInfo,
                        render: () => {
                            if (typeof column.cell === 'function') {
                                return column.cell(renderProps);
                            }

                            return cellValue;
                        },
                    };
                }),
            };
        });
    };

    private initialize = () => {
        this.state.rows.set(this.createRows(this.options.data, this.options.columns));
        this.state.headers.set(this.createHeaders());
    };

    constructor(options: DataGridOptions<TRow>) {
        this.options = options;
        this.state = new DataGridStates<TRow>();
        this.selection = new DataGridSelection(this.state);
        this.initialize();
    }

    public options: DataGridOptions<TRow>;
    public state: DataGridStates<TRow>;
    public selection: DataGridSelection<TRow>;

    public updateOptions = (newOptions: DataGridOptions<TRow>) => {
        const { columns, data } = newOptions;
        if (data !== this.options.data) {
            this.state.rows.set(this.createRows(data, columns));
        }
        if (columns !== this.options.columns) {
            this.state.headers.set(this.createHeaders());
        }

        this.options = newOptions;
    };

    public isCellDisabled = (rowIndex: number, columnIndex: number) => {
        const { columns } = this.options;

        const column = columns[columnIndex];
        if (column) {
            const disabled = column.disabled;
            return typeof disabled === 'function' ? disabled({ value: {}, rowIndex }) : disabled;
        }
        return false;
    };

    public updateData = (rowIndex: number, item: TRow) => {
        const { onChange, data } = this.options;
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
        const { activeCell, selectedArea } = this.state;
        const { onChange, columns, data } = this.options;
        if (!onChange) {
            return;
        }

        if (!activeCell.value) {
            return;
        }

        const min: CellCoordinates = selectedArea.value?.min || activeCell.value;
        const max: CellCoordinates = selectedArea.value?.max || activeCell.value;

        const newData = [...data];

        for (let row = min.row; row <= max.row; ++row) {
            const modifiedRowData = { ...newData[row] };

            for (let col = min.col; col <= max.col; ++col) {
                const column = columns[col];
                if (!column.dataKey) {
                    continue;
                }

                const cellDisabled = this.isCellDisabled(row, col);
                if (cellDisabled) {
                    continue;
                }

                delete modifiedRowData[column.dataKey];
            }

            newData[row] = modifiedRowData;
        }

        onChange(
            newData,
            [{
                type: 'UPDATE',
                fromRowIndex: min.row,
                toRowIndex: max.row + 1,
            }]
        );
    };

    public insertRowAfter = (rowIndex: number, count = 1) => {
        const { selectedCell, editing } = this.state;
        const { createRow, onChange, data, lockRows } = this.options;

        if (lockRows) {
            return;
        }

        selectedCell.set(null);
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
        const { onChange, duplicateRow, data, lockRows } = this.options;
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

    public applyPasteData = async (pasteData: string[][]) => {
        const { activeCell, selectedArea, editing } = this.state;
        const { createRow, onChange, columns, data, lockRows } = this.options;

        if (!activeCell.value || !editing.value) {
            return;
        }

        const min: CellCoordinates = selectedArea.value?.min || activeCell?.value;
        const max: CellCoordinates = selectedArea.value?.max || activeCell?.value;

        const results = await Promise.all(
            pasteData[0].map((_, columnIndex) => {
                const column = columns[min.col + columnIndex];
                const values = pasteData.map((row) => row[columnIndex]);
                return column.prePasteValues?.(values) ?? values;
            })
        );

        pasteData = pasteData.map((_, rowIndex) =>
            results.map((column) => column[rowIndex])
        );

        // Paste single row
        if (pasteData.length === 1) {
            const newData = [...data];

            for (let columnIndex = 0; columnIndex < pasteData[0].length; columnIndex++) {
                const column = columns[min.col + columnIndex];
                const pasteValue = column?.pasteValue;

                if (!pasteValue) {
                    continue;
                }

                for (let rowIndex = min.row; rowIndex <= max.row; rowIndex++) {
                    if (!this.isCellDisabled(rowIndex, columnIndex + min.col)) {
                        newData[rowIndex] = await pasteValue({
                            rowData: newData[rowIndex],
                            value: pasteData[0][columnIndex],
                            rowIndex,
                        });
                    }
                }
            }

            onChange?.(newData, [
                {
                    type: 'UPDATE',
                    fromRowIndex: min.row,
                    toRowIndex: max.row + 1,
                },
            ]);

            return;
        }

        // Paste multiple rows
        let newData = [...data];
        const missingRows = min.row + pasteData.length - data.length;

        if (missingRows > 0) {
            if (!lockRows) {
                const newRowData = new Array(missingRows).fill(0).map(() => createRow ? createRow() : {} as TRow);
                newData = [...newData, ...newRowData];
            } else {
                pasteData.splice(pasteData.length - missingRows, missingRows);
            }
        }

        for (
            let columnIndex = min.col;
            (columnIndex < pasteData[0].length) && (columnIndex < columns.length - 1);
            columnIndex++
        ) {
            const pasteValue = columns[columnIndex]?.pasteValue;

            if (pasteValue) {
                for (let rowIndex = 0; rowIndex < pasteData.length; rowIndex++) {
                    const isCellDisabled = this.isCellDisabled(min.row + rowIndex, columnIndex);
                    if (isCellDisabled) {
                        continue;
                    }

                    newData[min.row + rowIndex] = await pasteValue({
                        rowData: newData[min.row + rowIndex],
                        value: pasteData[rowIndex][columnIndex],
                        rowIndex: min.row + rowIndex,
                    });
                }
            }
        }

        const operations: RowOperation[] = [
            {
                type: 'UPDATE',
                fromRowIndex: min.row,
                toRowIndex:
                    min.row +
                    pasteData.length -
                    (!lockRows && missingRows > 0 ? missingRows : 0),
            },
        ];

        if (missingRows > 0 && !lockRows) {
            operations.push({
                type: 'CREATE',
                fromRowIndex: min.row + pasteData.length - missingRows,
                toRowIndex: min.row + pasteData.length,
            });
        }

        onChange?.(newData, operations);
    };

    public deleteRows = (fromRow: number, toRow: number = fromRow) => {
        const { onChange, data, lockRows } = this.options;

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
};

