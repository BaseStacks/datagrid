import type { CellCoordinates, ColumnHeader, CellSelectedRangeWithCells, Row, RowData, WithId, CellId, DataGridOptions, ColumnFooter } from '../types';
import { DataGridState } from '../atomic/DataGridState';
import { extractCellId } from '../utils/idUtils';

export type DataGridEditingValue = false | 'inline' | 'floating';

export class DataGridStates<TRow extends RowData> {
    constructor(public options: DataGridOptions<TRow>) {
    }
    public editing = new DataGridState<DataGridEditingValue>(false);
    public activeCell = new DataGridState<WithId<CellId, CellCoordinates> | null>(null);
    public lastEditingCell = new DataGridState<WithId<CellId, CellCoordinates> | null>(null);
    public selectedRanges = new DataGridState<CellSelectedRangeWithCells[]>([]);
    public rows = new DataGridState<Row<TRow>[]>([], { useDeepEqual: false });
    public headers = new DataGridState<ColumnHeader[]>([], { useDeepEqual: false });
    public footers = new DataGridState<ColumnFooter[]>([], { useDeepEqual: false });

    public getCellById = (id: CellId) => {
        const { rows, headers } = this;
        const { rowIndex, columnIndex } = extractCellId(id);
        if (rowIndex < 0 || rowIndex >= rows.value.length || columnIndex < 0 || columnIndex >= headers.value.length) {
            return null;
        }
        const row = rows.value[rowIndex];
        const header = headers.value[columnIndex];
        if (!row || !header) {
            return null;
        }

        return row.cells[columnIndex] || null;
    };

    public getCellAttributes = (id: CellId) => {
        const cell = this.getCellById(id);
        if (!cell) {
            return null;
        }

        const { headerId } = cell;
        const header = this.headers.value.find((h) => h.id === headerId);
        if (!header) {
            return null;
        }

        const { column } = header;

        return {
            disabled: column.disabled,
            selectable: column.selectable,
            fillable: column.fillable,
        };
    };
};
