import type { CellCoordinates, CellSelectedRange, SelectionBoundary } from '../types';
import { getCoordinatesById, getCellId } from './cellUtils';

export const calculateRangeBoundary = ({ start, end }: CellSelectedRange): SelectionBoundary => {
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

export const breakRangeToSmallerPart = (range: CellSelectedRange, extrude: CellSelectedRange): CellSelectedRange[] => {
    const { min: rangeMin, max: rangeMax } = calculateRangeBoundary(range);
    const { min: extrudeMin, max: extrudeMax } = calculateRangeBoundary(extrude);

    // Check if there's any overlap
    if (extrudeMax.col < rangeMin.col || extrudeMin.col > rangeMax.col ||
        extrudeMax.row < rangeMin.row || extrudeMin.row > rangeMax.row) {
        // No overlap, return the original range
        return [{ start: getCellId({ col: rangeMin.col, row: rangeMin.row }), end: getCellId({ col: rangeMax.col, row: rangeMax.row }) }];
    }

    // Check if extrude completely contains the range
    if (extrudeMin.col <= rangeMin.col && extrudeMax.col >= rangeMax.col &&
        extrudeMin.row <= rangeMin.row && extrudeMax.row >= rangeMax.row) {
        // Extrude completely covers the range, return empty array
        return [];
    }

    const result: CellSelectedRange[] = [];

    // Range above the extrude
    if (rangeMin.row < extrudeMin.row) {
        result.push({
            start: getCellId({ col: rangeMin.col, row: rangeMin.row }),
            end: getCellId({ col: rangeMax.col, row: extrudeMin.row - 1 })
        });
    }

    // Range below the extrude
    if (rangeMax.row > extrudeMax.row) {
        result.push({
            start: getCellId({ col: rangeMin.col, row: extrudeMax.row + 1 }),
            end: getCellId({ col: rangeMax.col, row: rangeMax.row })
        });
    }

    // Range to the left of the extrude (middle section only)
    const leftMinRow = Math.max(rangeMin.row, extrudeMin.row);
    const leftMaxRow = Math.min(rangeMax.row, extrudeMax.row);
    if (rangeMin.col < extrudeMin.col && leftMinRow <= leftMaxRow) {
        result.push({
            start: getCellId({ col: rangeMin.col, row: leftMinRow }),
            end: getCellId({ col: extrudeMin.col - 1, row: leftMaxRow })
        });
    }

    // Range to the right of the extrude (middle section only)
    const rightMinRow = Math.max(rangeMin.row, extrudeMin.row);
    const rightMaxRow = Math.min(rangeMax.row, extrudeMax.row);
    if (rangeMax.col > extrudeMax.col && rightMinRow <= rightMaxRow) {
        result.push({
            start: getCellId({ col: extrudeMax.col + 1, row: rightMinRow }),
            end: getCellId({ col: rangeMax.col, row: rightMaxRow })
        });
    }

    return result;
};

export const isRangeOverlapping = (rangeA: CellSelectedRange, rangeB: CellSelectedRange): boolean => {
    const { min: rangeAMin, max: rangeAMax } = calculateRangeBoundary(rangeA);
    const { min: rangeBMin, max: rangeBMax } = calculateRangeBoundary(rangeB);

    return !(rangeAMax.col < rangeBMin.col || rangeAMin.col > rangeBMax.col ||
        rangeAMax.row < rangeBMin.row || rangeAMin.row > rangeBMax.row);
};

export const isRangeEqual = (rangeA: CellSelectedRange, rangeB: CellSelectedRange): boolean => {
    const { min: rangeAMin, max: rangeAMax } = calculateRangeBoundary(rangeA);
    const { min: rangeBMin, max: rangeBMax } = calculateRangeBoundary(rangeB);

    return (
        rangeAMin.col === rangeBMin.col &&
        rangeAMin.row === rangeBMin.row &&
        rangeAMax.col === rangeBMax.col &&
        rangeAMax.row === rangeBMax.row
    );
};

export const isRangeInsideOthers = (range: CellSelectedRange, others: CellSelectedRange[]): CellSelectedRange[] => {
    const { min: rangeMin, max: rangeMax } = calculateRangeBoundary(range);
    return others.filter(other => {
        const { min: otherMin, max: otherMax } = calculateRangeBoundary(other);
        return (
            rangeMin.col >= otherMin.col &&
            rangeMin.row >= otherMin.row &&
            rangeMax.col <= otherMax.col &&
            rangeMax.row <= otherMax.row
        );
    });
};

export const isRangeAdjacent = (rangeA: CellSelectedRange, rangeB: CellSelectedRange): boolean => {
    const { min: rangeAMin, max: rangeAMax } = calculateRangeBoundary(rangeA);
    const { min: rangeBMin, max: rangeBMax } = calculateRangeBoundary(rangeB);

    return (
        (rangeAMax.col + 1 === rangeBMin.col && rangeAMin.row <= rangeBMax.row && rangeAMax.row >= rangeBMin.row) ||
        (rangeAMin.col - 1 === rangeBMax.col && rangeAMin.row <= rangeBMax.row && rangeAMax.row >= rangeBMin.row) ||
        (rangeAMax.row + 1 === rangeBMin.row && rangeAMin.col <= rangeBMax.col && rangeAMax.col >= rangeBMin.col) ||
        (rangeAMin.row - 1 === rangeBMax.row && rangeAMin.col <= rangeBMax.col && rangeAMax.col >= rangeBMin.col)
    );
};

/**
 * Attempts to combine multiple selected ranges into a single rectangular range.
 * 
 * This function analyzes a collection of selected ranges to determine if they form
 * a perfect rectangle when combined. A perfect rectangle means that there are no
 * "holes" or missing cells within the boundary.
 * 
 * @param ranges - An array of SelectedRange objects to analyze
 * @returns The combined rectangular SelectedRange if the input ranges form a perfect rectangle,
 *          or null if:
 *          - The input array is empty
 *          - The input array contains only one range
 *          - The selected ranges do not form a perfect rectangle (have gaps or irregular shape)
 */
export const tryMakeRectangle = (ranges: CellSelectedRange[]) => {
    // If no ranges, return empty array
    if (ranges.length === 0) {
        return null;
    }

    // If only one range, return it as is
    if (ranges.length === 1) {
        return null;
    }

    // Find the overall boundary that would encompass all ranges
    let minCol = Infinity, minRow = Infinity, maxCol = -Infinity, maxRow = -Infinity;

    for (const range of ranges) {
        const { min, max } = calculateRangeBoundary(range);
        minCol = Math.min(minCol, min.col);
        minRow = Math.min(minRow, min.row);
        maxCol = Math.max(maxCol, max.col);
        maxRow = Math.max(maxRow, max.row);
    }

    // Create the potential rectangle range
    const potentialRectangle: CellSelectedRange = {
        start: getCellId({ col: minCol, row: minRow }),
        end: getCellId({ col: maxCol, row: maxRow })
    };

    // Calculate the total cells in all input ranges
    const cells: CellCoordinates[] = [];
    for (const range of ranges) {
        const { min, max } = calculateRangeBoundary(range);
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

    // Otherwise, return the original ranges
    return null;
};

type RangeGroup = {
    members: CellSelectedRange[];
    mergedRange: CellSelectedRange | null;
};

const createRangeGroup = (currentRange: CellSelectedRange, others: CellSelectedRange[]): RangeGroup => {
    const members = [
        currentRange,
        ...others
            .filter(other => other != currentRange)
            .filter(other => isRangeAdjacent(currentRange, other) || isRangeOverlapping(currentRange, other))
    ];

    const group: RangeGroup = {
        members: members,
        mergedRange: tryMakeRectangle(members)
    };

    return group;
};

/**
 * Attempts to combine adjacent or overlapping ranges into larger rectangle ranges.
 * Continues combining until no further combines are possible.
 * 
 * @param ranges - Array of selected ranges to combine
 * @returns Array of combined rectangle ranges
 */
export const tryCombineRanges = (ranges: CellSelectedRange[]): CellSelectedRange[] => {
    // Return early if there's nothing to combine
    if (ranges.length < 2) return ranges;

    const mergedRanges: CellSelectedRange[] = [];
    let remainingRanges = [...ranges];

    // Process ranges until none remain
    while (remainingRanges.length > 0) {
        const currentRange = remainingRanges[0];

        // Try to group with adjacent/overlapping ranges
        const group = createRangeGroup(currentRange, remainingRanges);

        if (group.mergedRange) {
            // If a rectangle merge was possible, add it to results
            mergedRanges.push(group.mergedRange);
            // Remove all ranges that were part of this group
            remainingRanges = remainingRanges.filter(range => !group.members.includes(range));
        } else {
            // If no merge possible, keep the current range as-is
            mergedRanges.push(currentRange);
            remainingRanges.shift(); // Remove current range from next loop
        }
    }

    // If any merges occurred, recursively try to merge the results again
    const hadMerges = mergedRanges.length < ranges.length;
    if (hadMerges) {
        return tryCombineRanges(mergedRanges);
    }

    return mergedRanges;
};

export const tryRemoveDuplicates = (ranges: CellSelectedRange[]): CellSelectedRange[] => {
    const uniqueRanges: CellSelectedRange[] = [];

    ranges.forEach(range => {
        if (!uniqueRanges.some(existingRange => isRangeEqual(existingRange, range))) {
            uniqueRanges.push(range);
        }
    });

    return uniqueRanges;
};

