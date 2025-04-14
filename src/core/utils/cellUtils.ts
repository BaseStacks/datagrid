import type { CellCoordinates, SelectedArea } from '../types';

export const getCellId = (rowIndex: number, columnIndex: number): string => {
    return `${rowIndex}-${columnIndex}`;
};

export const compareCoordinates = (a?: CellCoordinates | null, b?: CellCoordinates | null): boolean => {
    return a?.row === b?.row && a?.col === b?.col;
};

export const getSelectedArea = (from: CellCoordinates, to: CellCoordinates): SelectedArea => {
    return {
        min: {
            col: Math.min(from.col, to.col),
            row: Math.min(from.row, to.row),
        },
        max: {
            col: Math.max(from.col, to.col),
            row: Math.max(from.row, to.row),
        },
    };
};
