import { CellCoordinates, RowData, RowOperation, RowSize } from '../types';
import deepEqual from 'fast-deep-equal';
import { DataGridStates } from './DataGridStates';

export class DataGridController<TRow extends RowData = RowData> {
    private calculatedHeights: RowSize[] = [];

    constructor(state: DataGridStates<TRow>) {
        this.state = state;
    }

    public state: DataGridStates<TRow>;

    public isCellDisabled = (rowIndex: number, columnIndex: number) => {
        const { columns } = this.state.options;

        const column = columns[columnIndex];
        if (column) {
            const disabled = column.disabled;
            return typeof disabled === 'function' ? disabled({ rowData: {}, rowIndex }) : disabled;
        }
        return false;
    };

    public duplicateRows = (rowMin: number, rowMax: number = rowMin) => {
        const { activeCell, selectedCell, editing } = this.state;
        const { onChange, duplicateRow, columns, data, lockRows, stickyRightColumn } = this.state.options;
        const hasStickyRightColumn = Boolean(stickyRightColumn);
        if (lockRows) {
            return;
        }

        onChange?.(
            [
                ...data.slice(0, rowMax + 1),
                ...data
                    .slice(rowMin, rowMax + 1)
                    .map((rowData, i) => duplicateRow ? duplicateRow({ rowData, rowIndex: i + rowMin }) : { ...rowData }),
                ...data.slice(rowMax + 1),
            ],
            [
                {
                    type: 'CREATE',
                    fromRowIndex: rowMax + 1,
                    toRowIndex: rowMax + 2 + rowMax - rowMin,
                },
            ]
        );
        activeCell.set({ col: 0, row: rowMax + 1, doNotScrollX: true });
        selectedCell.set({
            col: columns.length - (hasStickyRightColumn ? 3 : 2),
            row: 2 * rowMax - rowMin + 1,
            doNotScrollX: true,
        });
        editing.set(false);
    };

    public applyPasteData = async (pasteData: string[][]) => {
        const { activeCell, selectedCell, selectedRange, editing } = this.state;
        const { createRow, onChange, columns, data, lockRows, stickyRightColumn } = this.state.options;
        const hasStickyRightColumn = Boolean(stickyRightColumn);

        if (!editing.value && activeCell.value) {
            const min: CellCoordinates = selectedRange.value?.min || activeCell.value;
            const max: CellCoordinates = selectedRange.value?.max || activeCell.value;

            const results = await Promise.all(
                pasteData[0].map((_, columnIndex) => {
                    const prePasteValues = columns[min.col + columnIndex + 1]?.prePasteValues;
                    const values = pasteData.map((row) => row[columnIndex]);
                    return prePasteValues?.(values) ?? values;
                })
            );

            pasteData = pasteData.map((_, rowIndex) =>
                results.map((column) => column[rowIndex])
            );

            // Paste single row
            if (pasteData.length === 1) {
                const newData = [...data];

                for (
                    let columnIndex = 0;
                    columnIndex < pasteData[0].length;
                    columnIndex++
                ) {
                    const pasteValue = columns[min.col + columnIndex + 1]?.pasteValue;

                    if (pasteValue) {
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
                }

                onChange?.(newData, [
                    {
                        type: 'UPDATE',
                        fromRowIndex: min.row,
                        toRowIndex: max.row + 1,
                    },
                ]);

                activeCell.set({ col: min.col, row: min.row });
                selectedCell.set({
                    col: Math.min(
                        min.col + pasteData[0].length - 1,
                        columns.length - (hasStickyRightColumn ? 3 : 2)
                    ),
                    row: max.row,
                });
            } else {
                // Paste multiple rows
                let newData = [...data];
                const missingRows = min.row + pasteData.length - data.length;

                if (missingRows > 0) {
                    if (!lockRows) {
                        newData = [
                            ...newData,
                            ...new Array(missingRows).fill(0).map(() => createRow ? createRow() : {} as TRow),
                        ];
                    } else {
                        pasteData.splice(pasteData.length - missingRows, missingRows);
                    }
                }

                for (
                    let columnIndex = 0;
                    columnIndex < pasteData[0].length &&
                    min.col + columnIndex <
                    columns.length - (hasStickyRightColumn ? 2 : 1);
                    columnIndex++
                ) {
                    const pasteValue =
                        columns[min.col + columnIndex + 1]?.pasteValue;

                    if (pasteValue) {
                        for (
                            let rowIndex = 0;
                            rowIndex < pasteData.length;
                            rowIndex++
                        ) {
                            if (!this.isCellDisabled(min.row + rowIndex, min.col + columnIndex)) {
                                newData[min.row + rowIndex] = await pasteValue({
                                    rowData: newData[min.row + rowIndex],
                                    value: pasteData[rowIndex][columnIndex],
                                    rowIndex: min.row + rowIndex,
                                });
                            }
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
                activeCell.set({ col: min.col, row: min.row });
                selectedCell.set({
                    col: Math.min(
                        min.col + pasteData[0].length - 1,
                        columns.length - (hasStickyRightColumn ? 3 : 2)
                    ),
                    row: min.row + pasteData.length - 1,
                });
            }
        }
    };

    public deleteRows = (rowMin: number, rowMax: number = rowMin) => {
        const { activeCell, selectedCell, editing } = this.state;
        const { onChange, data, lockRows } = this.state.options;

        if (lockRows) {
            return;
        }

        editing.set(false);
        activeCell.set((a) => {
            const row = Math.min(
                data.length - 2 - rowMax + rowMin,
                rowMin
            );

            if (row < 0) {
                return null;
            }

            return a && { col: a.col, row };
        });
        selectedCell.set(null);
        onChange?.(
            [
                ...data.slice(0, rowMin),
                ...data.slice(rowMax + 1),
            ],
            [
                {
                    type: 'DELETE',
                    fromRowIndex: rowMin,
                    toRowIndex: rowMax + 1,
                },
            ]
        );
    };

    public deleteSelection = (_smartDelete = true) => {
        const { activeCell, selectedCell, selectedRange } = this.state;
        const { onChange, columns, data, disableSmartDelete, stickyRightColumn } = this.state.options;
        const hasStickyRightColumn = Boolean(stickyRightColumn);

        const smartDelete = _smartDelete && !disableSmartDelete;
        if (!activeCell.value) {
            return;
        }

        const min: CellCoordinates = selectedRange.value?.min || activeCell.value;
        const max: CellCoordinates = selectedRange.value?.max || activeCell.value;

        if (data.slice(min.row, max.row + 1).every((rowData, i) => columns.every((column) => column.isCellEmpty?.({ rowData, rowIndex: i + min.row })))) {
            if (smartDelete) {
                this.deleteRows(min.row, max.row);
            }
            return;
        }

        const newData = [...data];

        for (let row = min.row; row <= max.row; ++row) {
            for (let col = min.col; col <= max.col; ++col) {
                if (!this.isCellDisabled(row, col)) {
                    const { deleteValue = ({ rowData }) => rowData } =
                        columns[col + 1];
                    newData[row] = deleteValue({
                        rowData: newData[row],
                        rowIndex: row,
                    });
                }
            }
        }

        if (smartDelete && deepEqual(newData, data)) {
            activeCell.set({ col: 0, row: min.row, doNotScrollX: true });
            selectedCell.set({
                col: columns.length - (hasStickyRightColumn ? 3 : 2),
                row: max.row,
                doNotScrollX: true,
            });
            return;
        }

        onChange?.(newData, [
            {
                type: 'UPDATE',
                fromRowIndex: min.row,
                toRowIndex: max.row + 1,
            },
        ]);
    };

    public insertRowAfter = (rowIndex: number, count = 1) => {
        const { activeCell, selectedCell, editing } = this.state;
        const { createRow, onChange, data, lockRows } = this.state.options;

        if (lockRows) {
            return;
        }

        selectedCell.set(null);
        editing.set(false);

        onChange?.(
            [
                ...data.slice(0, rowIndex + 1),
                ...new Array(count).fill(0).map(() => createRow?.() ?? {} as TRow),
                ...data.slice(rowIndex + 1),
            ],
            [
                {
                    type: 'CREATE',
                    fromRowIndex: rowIndex + 1,
                    toRowIndex: rowIndex + 1 + count,
                },
            ]
        );
        activeCell.set((a) => ({
            col: a?.col || 0,
            row: rowIndex + count,
            doNotScrollX: true,
        }));
    };

    public setRowData = (rowIndex: number, item: TRow) => {
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

    public stopEditing = ({ nextRow = true } = {}) => {
        const { activeCell, editing } = this.state;
        const { data, autoAddRow } = this.state.options;

        if (activeCell.value?.row === data.length - 1) {
            if (nextRow && autoAddRow) {
                this.insertRowAfter(activeCell.value.row);
            } else {
                editing.set(false);
            }
        } else {
            editing.set(false);

            if (nextRow) {
                activeCell.set((a) => a && { col: a.col, row: a.row + 1 });
            }
        }
    };

    public getRowIndex = (top: number): number => {
        const { rowHeight, data } = this.state.options;

        if (typeof rowHeight === 'number') {
            return Math.min(
                data.length - 1,
                Math.max(-1, Math.floor(top / rowHeight))
            );
        }

        let l = 0;
        let r = this.calculatedHeights.length - 1;

        while (l <= r) {
            const m = Math.floor((l + r) / 2);

            if (this.calculatedHeights[m].top < top) {
                l = m + 1;
            } else if (this.calculatedHeights[m].top > top) {
                r = m - 1;
            } else {
                return m;
            }
        }

        if (
            r === this.calculatedHeights.length - 1 &&
            data.length > this.calculatedHeights.length &&
            (!this.calculatedHeights.length || top >= this.calculatedHeights[r].top + this.calculatedHeights[r].height)
        ) {
            let lastBottom = r === -1 ? 0 : this.calculatedHeights[r].top + this.calculatedHeights[r].height;

            do {
                r++;
                const height = rowHeight!({ rowIndex: r, rowData: data[r] });
                this.calculatedHeights.push({
                    height,
                    top: lastBottom,
                });
                lastBottom += height;
            } while (lastBottom <= top && r < this.calculatedHeights.length - 1);
        }

        return r;
    };

    public getRowSize = (rowIndex: number): RowSize => {
        const { rowHeight, data } = this.state.options;

        if (typeof rowHeight === 'number') {
            return { height: rowHeight, top: rowHeight * rowIndex };
        }

        if (rowIndex >= data.length) {
            return { height: 0, top: 0 };
        }

        if (rowIndex < this.calculatedHeights.length) {
            return this.calculatedHeights[rowIndex];
        }

        let lastBottom =
            this.calculatedHeights[this.calculatedHeights.length - 1].top +
            this.calculatedHeights[this.calculatedHeights.length - 1].height;

        for (let i = this.calculatedHeights.length; i <= rowIndex; i++) {
            const height = rowHeight!({ rowIndex: i, rowData: data[i] });

            this.calculatedHeights.push({ height, top: lastBottom });
            lastBottom += height;
        }

        return this.calculatedHeights[rowIndex];
    };

    public getRowTotalSize = (maxHeight: number): number => {
        const { rowHeight, data } = this.state.options;

        if (typeof rowHeight === 'number') {
            return data.length * rowHeight;
        }

        const index = this.getRowIndex(maxHeight);

        return (
            this.calculatedHeights[index].top +
            this.calculatedHeights[index].height
        );
    };
};

