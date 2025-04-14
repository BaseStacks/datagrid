import type { CellCoordinates } from '../types';

export const getCellId = (rowIndex: number, columnIndex: number): string => {
    return `${rowIndex}-${columnIndex}`;
};

export const compareCoordinates = (a?: CellCoordinates | null, b?: CellCoordinates | null): boolean => {
    return a?.row === b?.row && a?.col === b?.col;
};
