import type { ColumnKey, Id, RowDataKey } from '../types';

type IdType = 'cell' | 'header' | 'row';

type CellIdData = {
    readonly type: 'cell';
    readonly row: RowDataKey;
    readonly col: ColumnKey;
}

type ColumnIdData = {
    readonly type: 'header';
    readonly col: ColumnKey;
}

type RowIdData = {
    readonly type: 'row';
    readonly row: RowDataKey;
}

type IdData = CellIdData | ColumnIdData | RowIdData;

export const createId = (idData: IdData): Id => {
    if (idData.type === 'header') {
        return `${idData.type}:${idData.col}`;
    }

    if (idData.type === 'row') {
        return `${idData.type}:${idData.row}`;
    }

    return `${idData.type}:${idData.row}-${idData.col}`;
};

export const idTypeEquals = (id: Id, type: IdType): boolean => {
    const [idType] = id.split(':');
    return idType === type;
};

export const extractId = (id: string): IdData => {
    const [type, rest] = id.split(':');
    const [row, col] = rest.split('-').map(Number);
    return {
        type: type as IdType,
        row,
        col,
    };
};
