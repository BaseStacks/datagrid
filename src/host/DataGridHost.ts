import { defaultOptions } from './configs';
import type { CellProps, Column, ColumnHeader, DataGridOptions, HeaderId, Row, RowData, RowId } from './types';
import { createCellId } from './utils/cellUtils';
import { createId } from './utils/idUtils';
import { updateRowData } from './utils/rowUtils';
import type { DataGridPlugin } from './atomic/DataGridPlugin';
import { DataGridEvents } from './cores/DataGridEvents';
import { DataGridModifier } from './cores/DataGridModifier';
import { DataGridSelection } from './cores/DataGridSelection';
import { DataGridStates } from './cores/DataGridStates';

export abstract class DataGridHost<TRow extends RowData = RowData> {
    public plugins: Map<string, DataGridPlugin<TRow, DataGridHost<TRow>>> = new Map();

    private createHeaders = (): ColumnHeader[] => {
        const { columns } = this.state.options;
        return columns.map((column, index) => ({
            id: createId({ type: 'header', columnKey: column.key }) as HeaderId,
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

            const rowKey = newRowData[this.state.options.rowKey];
            
            const rowId = createId({ type: 'row', row: rowKey }) as RowId;
            return {
                id: rowId,
                key: rowKey,
                index: rowIndex,
                data: newRowData,
                cells: columns.map((column, columnIndex) => {
                    const coordinates = {
                        rowIndex,
                        columnIndex,
                    };

                    const cellInfo = {
                        id: createCellId(coordinates),
                        rowId,
                        headerId: createId({ type: 'header', columnKey: column.key }) as HeaderId,
                        coordinates
                    };

                    const cellValue = newRowData[column.key as keyof TRow];

                    const renderProps: CellProps = {
                        ...cellInfo,
                        value: cellValue,
                        active: false,
                        focused: false,
                        disabled: false,
                        blur: this.selection.blur,
                        setValue: (nextValue) => {
                            if (!this.state.options.onChange) {
                                return;
                            }

                            const newRowData = updateRowData({
                                data: this.state.options.data,
                                columns: this.state.options.columns,
                                rowIndex,
                                columnIndex,
                                cellValue: nextValue,
                            });

                            this.modifier.updateData(rowIndex, newRowData);
                        },
                        onFocus: (callback) => {
                            return this.state.editing.watch((editing) => {
                                const activeCell = this.state.activeCell.value;
                                const isEditing = editing && activeCell?.rowIndex === rowIndex && activeCell?.columnIndex === columnIndex;
                                if (isEditing) {
                                    callback();
                                }
                            });
                        },
                        onBlur: (callback) => {
                            return this.state.editing.watch((newEditing) => {
                                const activeCell = this.state.activeCell.value;
                                const isEditing = newEditing && activeCell?.rowIndex === rowIndex && activeCell?.columnIndex === columnIndex;
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
            } as Row<TRow>;
        });
    };

    private initialize = () => {
        const { data, columns } = this.state.options;

        this.state.rows.set(this.createRows(data, columns));
        this.state.headers.set(this.createHeaders());
    };

    constructor(options: DataGridOptions<TRow>) {
        this.options = { ...(defaultOptions as any), ...options, };

        this.state = new DataGridStates<TRow>(this.options);
        this.modifier = new DataGridModifier(this.state);
        this.events = new DataGridEvents<TRow>(this.state);
        this.selection = new DataGridSelection(this.state);

        this.initialize();
    }

    public options: Required<DataGridOptions<TRow>>;
    public modifier: DataGridModifier<TRow>;
    public state: DataGridStates<TRow>;
    public selection: DataGridSelection<TRow>;
    public events: DataGridEvents<TRow>;

    public updateOptions = (newOptions: DataGridOptions<TRow>) => {
        const { columns, data } = newOptions;
        if (data !== this.options.data) {
            this.state.rows.set(this.createRows(data, columns));
        }

        if (columns !== this.options.columns) {
            this.state.headers.set(this.createHeaders());
        }

        this.options = {
            ...this.options,
            ...newOptions,
        };

        this.state.options = this.options;
    };
};
