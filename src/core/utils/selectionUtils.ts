import type { CellCoordinates, CellSelectedRange, SelectionBoundary } from '../types';
import { getCoordinatesById, getCellId } from './cellUtils';

export const calculateAreaBoundary = ({ start, end }: CellSelectedRange): SelectionBoundary => {
    const startCoordinates = getCoordinatesById(start);
    const endCoordinates = getCoordinatesById(end);

    return {
        min: {
            col: Math.min(startCoordinates.col, endCoordinates.col),
            row: Math.min(startCoordinates.row, endCoordinates.row),
        },
        max: {
            col: Math.max(startCoordinates.col, endCoordinates.col),
            row: Math.max(startCoordinates.row, endCoordinates.row),
        },
    };
};

export const breakAreaToSmallerPart = (area: CellSelectedRange, extrude: CellSelectedRange): CellSelectedRange[] => {
    const { min: areaMin, max: areaMax } = calculateAreaBoundary(area);
    const { min: extrudeMin, max: extrudeMax } = calculateAreaBoundary(extrude);

    // Check if there's any overlap
    if (extrudeMax.col < areaMin.col || extrudeMin.col > areaMax.col ||
        extrudeMax.row < areaMin.row || extrudeMin.row > areaMax.row) {
        // No overlap, return the original area
        return [{ start: getCellId({ col: areaMin.col, row: areaMin.row }), end: getCellId({ col: areaMax.col, row: areaMax.row }) }];
    }

    // Check if extrude completely contains the area
    if (extrudeMin.col <= areaMin.col && extrudeMax.col >= areaMax.col &&
        extrudeMin.row <= areaMin.row && extrudeMax.row >= areaMax.row) {
        // Extrude completely covers the area, return empty array
        return [];
    }

    const result: CellSelectedRange[] = [];

    // Area above the extrude
    if (areaMin.row < extrudeMin.row) {
        result.push({
            start: getCellId({ col: areaMin.col, row: areaMin.row }),
            end: getCellId({ col: areaMax.col, row: extrudeMin.row - 1 })
        });
    }

    // Area below the extrude
    if (areaMax.row > extrudeMax.row) {
        result.push({
            start: getCellId({ col: areaMin.col, row: extrudeMax.row + 1 }),
            end: getCellId({ col: areaMax.col, row: areaMax.row })
        });
    }

    // Area to the left of the extrude (middle section only)
    const leftMinRow = Math.max(areaMin.row, extrudeMin.row);
    const leftMaxRow = Math.min(areaMax.row, extrudeMax.row);
    if (areaMin.col < extrudeMin.col && leftMinRow <= leftMaxRow) {
        result.push({
            start: getCellId({ col: areaMin.col, row: leftMinRow }),
            end: getCellId({ col: extrudeMin.col - 1, row: leftMaxRow })
        });
    }

    // Area to the right of the extrude (middle section only)
    const rightMinRow = Math.max(areaMin.row, extrudeMin.row);
    const rightMaxRow = Math.min(areaMax.row, extrudeMax.row);
    if (areaMax.col > extrudeMax.col && rightMinRow <= rightMaxRow) {
        result.push({
            start: getCellId({ col: extrudeMax.col + 1, row: rightMinRow }),
            end: getCellId({ col: areaMax.col, row: rightMaxRow })
        });
    }

    return result;
};

export const isAreaOverlapping = (areaA: CellSelectedRange, areaB: CellSelectedRange): boolean => {
    const { min: areaAMin, max: areaAMax } = calculateAreaBoundary(areaA);
    const { min: areaBMin, max: areaBMax } = calculateAreaBoundary(areaB);

    return !(areaAMax.col < areaBMin.col || areaAMin.col > areaBMax.col ||
        areaAMax.row < areaBMin.row || areaAMin.row > areaBMax.row);
};

export const isAreaEqual = (areaA: CellSelectedRange, areaB: CellSelectedRange): boolean => {
    const { min: areaAMin, max: areaAMax } = calculateAreaBoundary(areaA);
    const { min: areaBMin, max: areaBMax } = calculateAreaBoundary(areaB);

    return (
        areaAMin.col === areaBMin.col &&
        areaAMin.row === areaBMin.row &&
        areaAMax.col === areaBMax.col &&
        areaAMax.row === areaBMax.row
    );
};

export const isAreaInsideOthers = (area: CellSelectedRange, others: CellSelectedRange[]): CellSelectedRange[] => {
    const { min: areaMin, max: areaMax } = calculateAreaBoundary(area);
    return others.filter(other => {
        const { min: otherMin, max: otherMax } = calculateAreaBoundary(other);
        return (
            areaMin.col >= otherMin.col &&
            areaMin.row >= otherMin.row &&
            areaMax.col <= otherMax.col &&
            areaMax.row <= otherMax.row
        );
    });
};

export const isAreaAdjacent = (areaA: CellSelectedRange, areaB: CellSelectedRange): boolean => {
    const { min: areaAMin, max: areaAMax } = calculateAreaBoundary(areaA);
    const { min: areaBMin, max: areaBMax } = calculateAreaBoundary(areaB);

    return (
        (areaAMax.col + 1 === areaBMin.col && areaAMin.row <= areaBMax.row && areaAMax.row >= areaBMin.row) ||
        (areaAMin.col - 1 === areaBMax.col && areaAMin.row <= areaBMax.row && areaAMax.row >= areaBMin.row) ||
        (areaAMax.row + 1 === areaBMin.row && areaAMin.col <= areaBMax.col && areaAMax.col >= areaBMin.col) ||
        (areaAMin.row - 1 === areaBMax.row && areaAMin.col <= areaBMax.col && areaAMax.col >= areaBMin.col)
    );
};

/**
 * Attempts to combine multiple selected areas into a single rectangular area.
 * 
 * This function analyzes a collection of selected areas to determine if they form
 * a perfect rectangle when combined. A perfect rectangle means that there are no
 * "holes" or missing cells within the boundary.
 * 
 * @param areas - An array of SelectedArea objects to analyze
 * @returns The combined rectangular SelectedArea if the input areas form a perfect rectangle,
 *          or null if:
 *          - The input array is empty
 *          - The input array contains only one area
 *          - The selected areas do not form a perfect rectangle (have gaps or irregular shape)
 */
export const tryMakeRectangle = (areas: CellSelectedRange[]) => {
    // If no areas, return empty array
    if (areas.length === 0) {
        return null;
    }

    // If only one area, return it as is
    if (areas.length === 1) {
        return null;
    }

    // Find the overall boundary that would encompass all areas
    let minCol = Infinity, minRow = Infinity, maxCol = -Infinity, maxRow = -Infinity;

    for (const area of areas) {
        const { min, max } = calculateAreaBoundary(area);
        minCol = Math.min(minCol, min.col);
        minRow = Math.min(minRow, min.row);
        maxCol = Math.max(maxCol, max.col);
        maxRow = Math.max(maxRow, max.row);
    }

    // Create the potential rectangle area
    const potentialRectangle: CellSelectedRange = {
        start: getCellId({ col: minCol, row: minRow }),
        end: getCellId({ col: maxCol, row: maxRow })
    };

    // Calculate the total cells in all input areas
    const cells: CellCoordinates[] = [];
    for (const area of areas) {
        const { min, max } = calculateAreaBoundary(area);
        for (let row = min.row; row <= max.row; row++) {
            for (let col = min.col; col <= max.col; col++) {
                const isCellExisting = cells.some(cell => cell.col === col && cell.row === row);
                if (!isCellExisting) {
                    cells.push({ col, row });
                }
            }
        }
    }

    const totalCells = cells.length;
    // Calculate cells in the potential rectangle
    const rectangleCells = (maxCol - minCol + 1) * (maxRow - minRow + 1);

    // If the total cells equals the rectangle cells, we have a perfect rectangle
    if (totalCells === rectangleCells) {
        return potentialRectangle;
    }

    // Otherwise, return the original areas
    return null;
};

type AreaGroup = {
    members: CellSelectedRange[];
    mergedArea: CellSelectedRange | null;
};

const createAreaGroup = (currentArea: CellSelectedRange, others: CellSelectedRange[]): AreaGroup => {
    const members = [
        currentArea,
        ...others
            .filter(other => other != currentArea)
            .filter(other => isAreaAdjacent(currentArea, other) || isAreaOverlapping(currentArea, other))
    ];

    const group: AreaGroup = {
        members: members,
        mergedArea: tryMakeRectangle(members)
    };

    return group;
};

/**
 * Attempts to combine adjacent or overlapping areas into larger rectangle areas.
 * Continues combining until no further combines are possible.
 * 
 * @param areas - Array of selected areas to combine
 * @returns Array of combined rectangle areas
 */
export const tryCombineAreas = (areas: CellSelectedRange[]): CellSelectedRange[] => {
    // Return early if there's nothing to combine
    if (areas.length < 2) return areas;

    const mergedAreas: CellSelectedRange[] = [];
    let remainingAreas = [...areas];

    // Process areas until none remain
    while (remainingAreas.length > 0) {
        const currentArea = remainingAreas[0];

        // Try to group with adjacent/overlapping areas
        const group = createAreaGroup(currentArea, remainingAreas);

        if (group.mergedArea) {
            // If a rectangle merge was possible, add it to results
            mergedAreas.push(group.mergedArea);
            // Remove all areas that were part of this group
            remainingAreas = remainingAreas.filter(area => !group.members.includes(area));
        } else {
            // If no merge possible, keep the current area as-is
            mergedAreas.push(currentArea);
            remainingAreas.shift(); // Remove current area from next loop
        }
    }

    // If any merges occurred, recursively try to merge the results again
    const hadMerges = mergedAreas.length < areas.length;
    if (hadMerges) {
        return tryCombineAreas(mergedAreas);
    }

    return mergedAreas;
};

export const tryRemoveDuplicates = (areas: CellSelectedRange[]): CellSelectedRange[] => {
    const uniqueAreas: CellSelectedRange[] = [];

    areas.forEach(area => {
        if (!uniqueAreas.some(existingArea => isAreaEqual(existingArea, area))) {
            uniqueAreas.push(area);
        }
    });

    return uniqueAreas;
};

