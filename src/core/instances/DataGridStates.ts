import { createDataGridState } from '../helpers/datagridHelpers';
import { CellCoordinates, CellProps, Column, DataGridOptions, HeaderCell, RangeSelection, Row, RowData, ScrollBehavior, SelectionMode } from '../types';
import { getCellId } from '../utils/cellUtils';
import { setRowData } from '../utils/rowUtils';

export class DataGridStates<TRow extends RowData> {
    private createHeaders = (): HeaderCell[] => {
        const { columns } = this.options;
        return columns.map((column, index) => ({
            index,
            column,
            render: () => typeof column.header === 'function' ? column.header() : column.header,
        }));
    };

    private createRows = (data: TRow[], columns: Column[]): Row<TRow>[] => {
        return data.map((newRowData, rowIndex) => {
            const oldRow = this.rows.value[rowIndex];
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
                        setValue: (nextValue) => {
                            if (!this.options.onChange) {
                                return;
                            }

                            const newRowData = setRowData({
                                data: this.options.data,
                                columns: this.options.columns,
                                rowIndex,
                                columnIndex,
                                cellValue: nextValue,
                            });

                            const nextData = [...this.options.data];
                            nextData.splice(rowIndex, 1, newRowData);

                            this.options.onChange(nextData, [{ type: 'UPDATE', fromRowIndex: rowIndex, toRowIndex: rowIndex }]);
                        },
                        onFocus: (callback) => {
                            return this.editing.watch((editing) => {
                                const activeCell = this.activeCell.value;
                                const isEditing = editing && activeCell?.row === rowIndex && activeCell?.col === columnIndex;
                                if (isEditing) {
                                    callback();
                                }
                            });
                        },
                        onBlur: (callback) => {
                            return this.activeCell.watch((activeCell) => {
                                const isEditing = this.editing.value && activeCell?.row === rowIndex && activeCell?.col === columnIndex;
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

    constructor(options: DataGridOptions<TRow>) {
        this.options = options;

        this.rows.set(this.createRows(options.data, options.columns));
        this.headers.set(this.createHeaders());

        this.selectedCell.watch((selectedCell) => {
            // Active cell and Selected cell are two corner points of the selection
            if (!selectedCell || !this.activeCell.value) {
                if (this.selectedRange.value) {
                    this.selectedRange.set(null);
                }
                return;
            }

            const nextRange: RangeSelection = {
                min: {
                    col: Math.min(this.activeCell.value.col, selectedCell.col),
                    row: Math.min(this.activeCell.value.row, selectedCell.row),
                },
                max: {
                    col: Math.max(this.activeCell.value.col, selectedCell.col),
                    row: Math.max(this.activeCell.value.row, selectedCell.row),
                },
            };
            // Update the selected range
            this.selectedRange.set(nextRange);
        });
    }

    public options: DataGridOptions<TRow>;

    public editing = createDataGridState(false);
    public activeCell = createDataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public lastEditingCell = createDataGridState<CellCoordinates | null>(null);
    public selectedCell = createDataGridState<(CellCoordinates & ScrollBehavior) | null>(null);
    public selectedRange = createDataGridState<RangeSelection | null>(null);
    public dragging = createDataGridState<SelectionMode>({
        columns: false,
        rows: false,
        active: false,
    });

    public rows = createDataGridState<Row<TRow>[]>([]);
    public headers = createDataGridState<HeaderCell[]>([]);

    public updateOptions = (newOptions: DataGridOptions<TRow>) => {
        if (newOptions.data !== this.options.data) {
            this.rows.set(this.createRows(this.options.data, newOptions.columns));
        }

        if (newOptions.columns !== this.options.columns) {
            this.headers.set(this.createHeaders());
        }

        this.options = newOptions;
    };
};
