import type { CellCoordinates, SelectedArea, SelectionBoundary } from '../types';

export const getCellId = (rowIndex: number, columnIndex: number): string => {
    return `${rowIndex}-${columnIndex}`;
};

export const compareCoordinates = (a?: CellCoordinates | null, b?: CellCoordinates | null): boolean => {
    return a?.row === b?.row && a?.col === b?.col;
};

export const calculateAreaBoundary = ({ start, end }: SelectedArea): SelectionBoundary => {
    return {
        min: {
            col: Math.min(start.col, end.col),
            row: Math.min(start.row, end.row),
        },
        max: {
            col: Math.max(start.col, end.col),
            row: Math.max(start.row, end.row),
        },
    };
};
