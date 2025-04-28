import type { CellCoordinates, CellId } from '../types';

import { createId, extractCellId } from './idUtils';

export const createCellId = ({ rowIndex, columnIndex }: CellCoordinates) => {
    return createId({
        type: 'cell',
        rowIndex,
        columnIndex,
    }) as CellId;
};

export const getCoordinatesById = (id: CellId) => {
    const idData = extractCellId(id);
    if (idData.type !== 'cell') {
        throw new Error(`Invalid cell id: ${id}`);
    }

    return {
        rowIndex: idData.rowIndex,
        columnIndex: idData.columnIndex
    } as CellCoordinates;
};

export const compareCoordinates = (a?: CellCoordinates | null, b?: CellCoordinates | null): boolean => {
    return a?.rowIndex === b?.rowIndex && a?.columnIndex === b?.columnIndex;
};
