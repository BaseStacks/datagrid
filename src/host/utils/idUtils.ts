import type { CellId, ColumnKey, Id, RowDataKey } from '../types';

type IdType = 'cell' | 'header' | 'row';

type CellIdData = {
    readonly type: 'cell';
    readonly rowIndex: number;
    readonly columnIndex: number;
}

type HeaderIdData = {
    readonly type: 'header';
    readonly columnKey: ColumnKey;
}

type RowIdData = {
    readonly type: 'row';
    readonly row: RowDataKey;
}

type FooterIdData = {
    readonly type: 'footer';
    readonly columnKey: ColumnKey;
}

type IdData = CellIdData | HeaderIdData | RowIdData | FooterIdData;

export const createId = (idData: IdData): Id => {
    if (idData.type === 'header' || idData.type === 'footer') {
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

export const getMinCellId = (...ids: CellId[]): CellId => {
    ids.sort((a, b) => a.localeCompare(b));
    return ids[0];
};

export const getMaxCellId = (...ids: CellId[]): CellId => {
    ids.sort((a, b) => a.localeCompare(b));
    return ids[ids.length - 1];
};
