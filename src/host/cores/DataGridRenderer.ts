import type { CellId, CellRender, RowData } from '../types';
import type { DataGridModifier } from './DataGridModifier';
import type { DataGridStates } from './DataGridStates';

export class DataGridRenderer<TRow extends RowData> {
    constructor(private state: DataGridStates<TRow>, private modifier: DataGridModifier<TRow>) {
    }

    public renderCellValue = ({ rowId, id }: CellRender) => {
        const row = this.state.rows.value.find((row) => row.id === rowId);
        const cell = row!.cells.find((cell) => cell.id === id);

        if (!cell) {
            return null;
        }

        const header = this.state.headers.value.find((header) => header.id === cell.headerId);
        const cellValue = row?.data[header!.column.key as keyof TRow];

        const column = header!.column;
        if (typeof column.cell === 'function') {
            return column.cell({
                id: cell.id,
                rowId: cell.rowId,
                headerId: cell.headerId,
                value: cellValue,
                setValue: (newValue) => {
                    this.modifier.updateRowData(cell.coordinates.rowIndex, {
                        ...this.state.options.data[cell.coordinates.rowIndex],
                        [header!.column.key]: newValue,
                    });
                },
            });
        }

        return cellValue;
    };

    public renderEditor = () => {
        const { activeCell } = this.state;
        const { columns } = this.state.options;

        if (!activeCell.value) {
            return;
        }

        const { rowIndex, columnIndex } = activeCell.value;
        const column = columns[columnIndex];

        if (!column || !column.editor) {
            return;
        }

        const cellValue = this.state.options.data[rowIndex][column.key as keyof TRow];
        if (typeof column.editor === 'function') {
            return column.editor({
                id: activeCell.value.id as CellId,
                defaultValue: cellValue,
                setValue: (newValue) => {
                    this.modifier.updateRowData(rowIndex, {
                        ...this.state.options.data[rowIndex],
                        [column.key]: newValue,
                    });
                },
            });
        }

        return column.editor.render({
            id: activeCell.value.id as CellId,
            defaultValue: cellValue,
            setValue: (newValue) => {
                this.modifier.updateRowData(rowIndex, {
                    ...this.state.options.data[rowIndex],
                    [column.key]: newValue,
                });
            },
        });
    };
};
