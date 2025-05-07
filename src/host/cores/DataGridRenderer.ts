import type { CellRender, RowData } from '../types';
import { updateRowData } from '../utils/rowUtils';
import type { DataGridModifier } from './DataGridModifier';
import type { DataGridStates } from './DataGridStates';

export class DataGridRenderer<TRow extends RowData> {
    constructor(private state: DataGridStates<TRow>, private modifier: DataGridModifier<TRow>) {
    }


    public renderCell = ({ rowId, id, headerId, coordinates }: CellRender) => {
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
            return renderEditor({
                id: cell.id,
                defaultValue: cellValue,
                setValue: (nextValue) => {
                    if (!this.state.options.onChange) {
                        return;
                    }

                    const newRowData = updateRowData({
                        data: this.state.options.data,
                        columns: this.state.options.columns,
                        rowIndex: coordinates.rowIndex,
                        columnIndex: coordinates.columnIndex,
                        cellValue: nextValue,
                    });

                    this.modifier.updateData(coordinates.rowIndex, newRowData);
                }
            });
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
};
