import type { CellCoordinates, CellId } from '../types';

import { createId, extractId } from './idUtils';

export const createCellId = ({ row, col}: CellCoordinates) => {
    return createId({
        type: 'cell',
        row,
        col,
    }) as CellId;
};

export const getCoordinatesById = (id: CellId) => {
    const idData = extractId(id);
    if (idData.type !== 'cell') {
        throw new Error(`Invalid cell id: ${id}`);
    }

    return { row: idData.row, col: idData.col } as CellCoordinates;
};

export const compareCoordinates = (a?: CellCoordinates | null, b?: CellCoordinates | null): boolean => {
    return a?.row === b?.row && a?.col === b?.col;
};
