import type { CellId, ColumnKey, Id, RowDataKey } from '../types';

type IdType = 'cell' | 'header' | 'row';

type CellIdData = {
    readonly type: 'cell';
    readonly rowIndex: number;
    readonly columnIndex: number;
}

type ColumnIdData = {
    readonly type: 'header';
    readonly columnKey: ColumnKey;
}

type RowIdData = {
    readonly type: 'row';
    readonly row: RowDataKey;
}

type IdData = CellIdData | ColumnIdData | RowIdData;

export const createId = (idData: IdData): Id => {
    if (idData.type === 'header') {
        return `${idData.type}:${idData.columnKey}`;
    }

    if (idData.type === 'row') {
        return `${idData.type}:${idData.row}`;
    }

    return `${idData.type}:${idData.rowIndex}-${idData.columnIndex}`;
};

export const idTypeEquals = (id: Id, type: IdType): boolean => {
    const [idType] = id.split(':');
    return idType === type;
};

export const extractCellId = (id: CellId): CellIdData => {
    const [type, rest] = id.split(':');
    if (type !== 'cell') {
        throw new Error(`Invalid cell id: ${id}`);
    }

    const [rowIndex, columnIndex] = rest.split('-').map(Number);

    return {
        type,
        rowIndex,
        columnIndex,
    };
};

export const getIdType = (id: Id): IdType => {
    const [idType] = id.split(':');
    return idType as IdType;
};
