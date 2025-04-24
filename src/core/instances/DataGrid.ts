import { defaultOptions } from '../configs';
import type { CellProps, Column, ColumnHeader, DataGridOptions, HeaderId, Row, RowData, RowId } from '../types';
import { createCellId } from '../utils/cellUtils';
import { createId } from '../utils/idUtils';
import { updateRowData } from '../utils/rowUtils';
import type { DataGridPlugin, DataGridPluginConstructor, DataGridPluginOptions } from './atomic/DataGridPlugin';
import { DataGridEvents } from './DataGridEvents';
import { DataGridKeyBindings } from './DataGridKeyBindings';
import { DataGridLayout } from './DataGridLayout';
import { DataGridModifier } from './DataGridModifier';
import { DataGridSelection } from './DataGridSelection';
import { DataGridStates } from './DataGridStates';

export class DataGrid<TRow extends RowData = RowData> {
    private _plugins: Map<string, DataGridPlugin<any, TRow>> = new Map();

    private createHeaders = (): ColumnHeader[] => {
        const { columns } = this.state.options;
        return columns.map((column, index) => ({
            id: createId({ type: 'header', col: index }) as HeaderId,
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
                        row: rowIndex,
                        col: columnIndex,
                    };
                    const cellInfo = {
                        id: createCellId(coordinates),
                        rowId: createId({ type: 'row', row: rowIndex }) as RowId,
                        colId: createId({ type: 'header', col: columnIndex }) as HeaderId,
                        coordinates
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
                                const isEditing = editing && activeCell?.row === rowIndex && activeCell?.col === columnIndex;
                                if (isEditing) {
                                    callback();
                                }
                            });
                        },
                        onBlur: (callback) => {
                            return this.state.editing.watch((newEditing) => {
                                const activeCell = this.state.activeCell.value;
                                const isEditing = newEditing && activeCell?.row === rowIndex && activeCell?.col === columnIndex;
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
        this.layout = new DataGridLayout(this.state);
        this.keyBindings = new DataGridKeyBindings(this.state, this.events);

        this.initialize();
    }

    public options: Required<DataGridOptions<TRow>>;
    public modifier: DataGridModifier<TRow>;
    public state: DataGridStates<TRow>;
    public selection: DataGridSelection<TRow>;
    public layout: DataGridLayout<TRow>;
    public keyBindings: DataGridKeyBindings<TRow>;
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
    };

    public addPlugin = <TOptions extends DataGridPluginOptions, TPlugin extends DataGridPlugin<Partial<TOptions>, TRow>>(
        PluginClass: DataGridPluginConstructor<TRow, TOptions, TPlugin>,
        options?: Partial<TOptions>
    ) => {
        const existingPlugin = this._plugins.get(PluginClass.name);

        if (existingPlugin) {
            return existingPlugin as TPlugin;
        }

        const newPlugin = new PluginClass(this, options ?? {});
        this._plugins.set(PluginClass.name, newPlugin);
        newPlugin.activate();
        return newPlugin;
    };

    public removePlugin = (PluginClass: new (dataGrid: DataGrid<TRow>, options: Partial<DataGridPluginOptions>) => DataGridPlugin<any, TRow>) => {
        const existingPlugin = this._plugins.get(PluginClass.name);

        if (!existingPlugin) {
            throw new Error(`Plugin ${PluginClass.name} does not exist.`);
        }

        existingPlugin.deactivate();
        this._plugins.delete(PluginClass.name);
    };
};
