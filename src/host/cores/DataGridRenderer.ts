import type { CellId, CellRender, RowData } from '../types';
import type { DataGridModifier } from './DataGridModifier';
import type { DataGridStates } from './DataGridStates';

export class DataGridRenderer<TRow extends RowData> {
    constructor(private state: DataGridStates<TRow>, private modifier: DataGridModifier<TRow>) {
    }

    public renderCell = ({ rowId, id, headerId }: CellRender) => {
        const row = this.state.rows.value.find((row) => row.id === rowId);
        const cell = row!.cells.find((cell) => cell.id === id);
        const header = this.state.headers.value.find((header) => header.id === headerId);

        if (!cell || !header) {
            return null;
        }

        const renderValue = header.column.cell;
        const renderEditor = header.column.editor;

        const cellValue = row?.data[header.column.key as keyof TRow];

        const isFocused = this.state.editing.value && this.state.activeCell.value?.id === id;
        if (isFocused && typeof renderEditor === 'function') {
            return this.renderEditor();
        }

        if (!renderValue) {
            return cellValue;
        }

        return renderValue({
            id: cell.id,
            rowId: cell.rowId,
            headerId: cell.headerId,
            value: cellValue
        });
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
                    this.modifier.updateData(rowIndex, {
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
                this.modifier.updateData(rowIndex, {
                    ...this.state.options.data[rowIndex],
                    [column.key]: newValue,
                });
            },
        });
    };
};
