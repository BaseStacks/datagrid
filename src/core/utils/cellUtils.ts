import type { CellCoordinates, Id } from '../types';

export const getCellId = ({ row, col }: CellCoordinates): string => {
    return `${row}-${col}`;
};

export const getCoordinatesById = (id: Id) => {
    const [row, col] = id.toString().split('-').map(Number);
    return { row, col } as CellCoordinates;
};

export const compareCoordinates = (a?: CellCoordinates | null, b?: CellCoordinates | null): boolean => {
    return a?.row === b?.row && a?.col === b?.col;
};
