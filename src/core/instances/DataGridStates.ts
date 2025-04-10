import { createDataGridState } from '../helpers/datagridHelpers';
import { CellCoordinates, DataGridProps, HeaderCell, RangeSelection, Row, RowData, ScrollBehavior, SelectionMode } from '../types';

export class DataGridStates<TRow extends RowData> {

    private getHeaders = (): HeaderCell[] => {
        const { columns } = this.options;
        return columns.map((column, index) => ({
            index,
            column,
            render: () => typeof column.header === 'function' ? column.header() : column.header,
        }));
    };

    private getRows = (): Row[] => {
        const { columns, data } = this.options;
        return data.map((row, index) => ({
            index,
            data,
            cells: columns.map((column, cellIndex) => ({
                cellIndex,
                render: () => {
                    const cellValue = row[column.dataKey as keyof TRow] ?? null;
                    if (typeof column.cell === 'function') {
                        return column.cell({
                            value: cellValue,
                            active: false,
                            focused: false,
                            disabled: false,
                            setValue: () => {
                                // Handle cell value change
                            },
                        });
                    }

                    return cellValue;
                },
            })),
        }));
    };

    constructor(options: DataGridProps<TRow>) {
        this.options = options;

        this.rows = this.getRows();
        this.headers = this.getHeaders();
    }

    public options: DataGridProps<TRow>;

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

    public rows: Row[] = [];
    public headers: HeaderCell[] = [];

};
