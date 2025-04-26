import type { CellCoordinates, CellSelectedRange, SelectionBoundary } from '../types';
import { getCoordinatesById, createCellId } from './cellUtils';

export const calculateRangeBoundary = ({ start, end }: CellSelectedRange): SelectionBoundary => {
    const startCoordinates = getCoordinatesById(start);
    const endCoordinates = getCoordinatesById(end);

    return {
        min: {
            columnIndex: Math.min(startCoordinates.columnIndex, endCoordinates.columnIndex),
            rowIndex: Math.min(startCoordinates.rowIndex, endCoordinates.rowIndex),
        },
        max: {
            columnIndex: Math.max(startCoordinates.columnIndex, endCoordinates.columnIndex),
            rowIndex: Math.max(startCoordinates.rowIndex, endCoordinates.rowIndex),
        },
    };
};

export const breakRangeToSmallerPart = (range: CellSelectedRange, extrude: CellSelectedRange): CellSelectedRange[] => {
    const { min: rangeMin, max: rangeMax } = calculateRangeBoundary(range);
    const { min: extrudeMin, max: extrudeMax } = calculateRangeBoundary(extrude);

    // Check if there's any overlap
    if (extrudeMax.columnIndex < rangeMin.columnIndex || extrudeMin.columnIndex > rangeMax.columnIndex ||
        extrudeMax.rowIndex < rangeMin.rowIndex || extrudeMin.rowIndex > rangeMax.rowIndex) {
        // No overlap, return the original range
        return [{ start: createCellId({ columnIndex: rangeMin.columnIndex, rowIndex: rangeMin.rowIndex }), end: createCellId({ columnIndex: rangeMax.columnIndex, rowIndex: rangeMax.rowIndex }) }];
    }

    // Check if extrude completely contains the range
    if (extrudeMin.columnIndex <= rangeMin.columnIndex && extrudeMax.columnIndex >= rangeMax.columnIndex &&
        extrudeMin.rowIndex <= rangeMin.rowIndex && extrudeMax.rowIndex >= rangeMax.rowIndex) {
        // Extrude completely covers the range, return empty array
        return [];
    }

    const result: CellSelectedRange[] = [];

    // Range above the extrude
    if (rangeMin.rowIndex < extrudeMin.rowIndex) {
        result.push({
            start: createCellId({ columnIndex: rangeMin.columnIndex, rowIndex: rangeMin.rowIndex }),
            end: createCellId({ columnIndex: rangeMax.columnIndex, rowIndex: extrudeMin.rowIndex - 1 })
        });
    }

    // Range below the extrude
    if (rangeMax.rowIndex > extrudeMax.rowIndex) {
        result.push({
            start: createCellId({ columnIndex: rangeMin.columnIndex, rowIndex: extrudeMax.rowIndex + 1 }),
            end: createCellId({ columnIndex: rangeMax.columnIndex, rowIndex: rangeMax.rowIndex })
        });
    }

    // Range to the left of the extrude (middle section only)
    const leftMinRow = Math.max(rangeMin.rowIndex, extrudeMin.rowIndex);
    const leftMaxRow = Math.min(rangeMax.rowIndex, extrudeMax.rowIndex);
    if (rangeMin.columnIndex < extrudeMin.columnIndex && leftMinRow <= leftMaxRow) {
        result.push({
            start: createCellId({ columnIndex: rangeMin.columnIndex, rowIndex: leftMinRow }),
            end: createCellId({ columnIndex: extrudeMin.columnIndex - 1, rowIndex: leftMaxRow })
        });
    }

    // Range to the right of the extrude (middle section only)
    const rightMinRow = Math.max(rangeMin.rowIndex, extrudeMin.rowIndex);
    const rightMaxRow = Math.min(rangeMax.rowIndex, extrudeMax.rowIndex);
    if (rangeMax.columnIndex > extrudeMax.columnIndex && rightMinRow <= rightMaxRow) {
        result.push({
            start: createCellId({ columnIndex: extrudeMax.columnIndex + 1, rowIndex: rightMinRow }),
            end: createCellId({ columnIndex: rangeMax.columnIndex, rowIndex: rightMaxRow })
        });
    }

    return result;
};

export const isRangeOverlapping = (rangeA: CellSelectedRange, rangeB: CellSelectedRange): boolean => {
    const { min: rangeAMin, max: rangeAMax } = calculateRangeBoundary(rangeA);
    const { min: rangeBMin, max: rangeBMax } = calculateRangeBoundary(rangeB);

    return !(rangeAMax.columnIndex < rangeBMin.columnIndex || rangeAMin.columnIndex > rangeBMax.columnIndex ||
        rangeAMax.rowIndex < rangeBMin.rowIndex || rangeAMin.rowIndex > rangeBMax.rowIndex);
};

export const isRangeEqual = (rangeA: CellSelectedRange, rangeB: CellSelectedRange): boolean => {
    const { min: rangeAMin, max: rangeAMax } = calculateRangeBoundary(rangeA);
    const { min: rangeBMin, max: rangeBMax } = calculateRangeBoundary(rangeB);

    return (
        rangeAMin.columnIndex === rangeBMin.columnIndex &&
        rangeAMin.rowIndex === rangeBMin.rowIndex &&
        rangeAMax.columnIndex === rangeBMax.columnIndex &&
        rangeAMax.rowIndex === rangeBMax.rowIndex
    );
};

export const isRangeInsideOthers = (range: CellSelectedRange, others: CellSelectedRange[]): CellSelectedRange[] => {
    const { min: rangeMin, max: rangeMax } = calculateRangeBoundary(range);
    return others.filter(other => {
        const { min: otherMin, max: otherMax } = calculateRangeBoundary(other);
        return (
            rangeMin.columnIndex >= otherMin.columnIndex &&
            rangeMin.rowIndex >= otherMin.rowIndex &&
            rangeMax.columnIndex <= otherMax.columnIndex &&
            rangeMax.rowIndex <= otherMax.rowIndex
        );
    });
};

export const isRangeAdjacent = (rangeA: CellSelectedRange, rangeB: CellSelectedRange): boolean => {
    const { min: rangeAMin, max: rangeAMax } = calculateRangeBoundary(rangeA);
    const { min: rangeBMin, max: rangeBMax } = calculateRangeBoundary(rangeB);

    return (
        (rangeAMax.columnIndex + 1 === rangeBMin.columnIndex && rangeAMin.rowIndex <= rangeBMax.rowIndex && rangeAMax.rowIndex >= rangeBMin.rowIndex) ||
        (rangeAMin.columnIndex - 1 === rangeBMax.columnIndex && rangeAMin.rowIndex <= rangeBMax.rowIndex && rangeAMax.rowIndex >= rangeBMin.rowIndex) ||
        (rangeAMax.rowIndex + 1 === rangeBMin.rowIndex && rangeAMin.columnIndex <= rangeBMax.columnIndex && rangeAMax.columnIndex >= rangeBMin.columnIndex) ||
        (rangeAMin.rowIndex - 1 === rangeBMax.rowIndex && rangeAMin.columnIndex <= rangeBMax.columnIndex && rangeAMax.columnIndex >= rangeBMin.columnIndex)
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
export const tryMakeRectangle = <TRange extends CellSelectedRange>(ranges: TRange[]) => {
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
        minCol = Math.min(minCol, min.columnIndex);
        minRow = Math.min(minRow, min.rowIndex);
        maxCol = Math.max(maxCol, max.columnIndex);
        maxRow = Math.max(maxRow, max.rowIndex);
    }

    // Create the potential rectangle range
    const potentialRectangle = {
        start: createCellId({ columnIndex: minCol, rowIndex: minRow }),
        end: createCellId({ columnIndex: maxCol, rowIndex: maxRow })
    } as TRange;

    // Calculate the total cells in all input ranges
    const cells: CellCoordinates[] = [];
    for (const range of ranges) {
        const { min, max } = calculateRangeBoundary(range);
        for (let row = min.rowIndex; row <= max.rowIndex; row++) {
            for (let col = min.columnIndex; col <= max.columnIndex; col++) {
                const isCellExisting = cells.some(cell => cell.columnIndex === col && cell.rowIndex === row);
                if (!isCellExisting) {
                    cells.push({ columnIndex: col, rowIndex: row });
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

type RangeGroup<TRange extends CellSelectedRange> = {
    members: TRange[];
    mergedRange: TRange | null;
};

const createRangeGroup = <TRange extends CellSelectedRange>(currentRange: TRange, others: TRange[]) => {
    const members = [
        currentRange,
        ...others
            .filter(other => other != currentRange)
            .filter(other => isRangeAdjacent(currentRange, other) || isRangeOverlapping(currentRange, other))
    ];

    const group: RangeGroup<TRange> = {
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
export const tryCombineRanges = <TRange extends CellSelectedRange>(ranges: TRange[]): TRange[] => {
    // Return early if there's nothing to combine
    if (ranges.length < 2) return ranges;

    const mergedRanges: TRange[] = [];
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

export const tryRemoveDuplicates = <TRange extends CellSelectedRange>(ranges: TRange[]): TRange[] => {
    const uniqueRanges: TRange[] = [];

    ranges.forEach(range => {
        if (!uniqueRanges.some(existingRange => isRangeEqual(existingRange, range))) {
            uniqueRanges.push(range);
        }
    });

    return uniqueRanges;
};

