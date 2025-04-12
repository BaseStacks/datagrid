import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { compareCoordinates, DataGridSelection, type Cell, type CellCoordinates, type RowData } from '../../core';
import { buildRectMap, findCoordByRect, findFromRectMap, findRect, getCursorOffset, mergeRects, RectType } from '../utils/domRectUtils';
import { useDocumentEventListener } from './dom/useDocumentEventListener';
import type { UseDataGridReturn } from './useDataGrid';

export const useSelection = <TRow extends RowData = RowData>(dataGrid: UseDataGridReturn<TRow>) => {
    const { editing, dragging, activeCell, selectedCell, selectedRange } = dataGrid.state;

    const [selection] = useState(() => {
        return new DataGridSelection(dataGrid.state);
    });

    const { cleanSelection } = selection;

    const containerRef = useRef<HTMLElement>(null);
    const isDraggingRef = useRef(false);
    const coordRectMap = useRef<Map<CellCoordinates, RectType | null>>(new Map());
    const coordElementMap = useRef<Map<CellCoordinates, HTMLElement | null>>(new Map());

    const [selectionRect, setSelectionRect] = useState<RectType | null>(null);
    const [activeRect, setActiveRect] = useState<RectType | null>(null);

    const registerCell = useCallback((cell: Cell) => (element: HTMLElement | null) => {
        coordElementMap.current.set(cell.coordinates, element);
    }, []);

    const startDragSelect = useRef((event: MouseEvent) => {
        const clickOutside = !containerRef.current?.contains(event.target as Node);
        if (clickOutside) {
            cleanSelection();
            return;
        }

        coordRectMap.current = buildRectMap(containerRef.current!, coordElementMap.current);
        const cursorOffset = getCursorOffset(event, containerRef.current!);
        const cellRect = findRect(cursorOffset, [...coordRectMap.current.values()]);
        if (!cellRect) {
            cleanSelection();
            return;
        }

        const cellCoord = findCoordByRect(coordRectMap.current!, cellRect);
        if (!cellCoord) {
            throw new Error('This should never happen!');
        }

        const clickOnActiveCell = compareCoordinates(cellCoord, activeCell.value!);
        if (!clickOnActiveCell) {
            activeCell.set(cellCoord);
        }

        const clickedOnEditingCell = clickOnActiveCell && editing.value;
        if (!clickedOnEditingCell) {
            event.preventDefault();
        }

        cleanSelection({
            maintainActiveCell: true,
            maintainEditing: true,
        });

        isDraggingRef.current = true;

        setTimeout(() => {
            if (!isDraggingRef.current) {
                return;
            }

            dragging.set({
                columns: cellCoord.col !== -1,
                rows: cellCoord.row !== -1,
                active: true,
            });
        }, 150);

    });

    const onMouseMove = useRef((event: MouseEvent) => {
        if (!isDraggingRef.current) {
            return;
        }

        const cursorOffset = getCursorOffset(event, containerRef.current!);
        const cellRect = findRect(cursorOffset, [...coordRectMap.current.values()]);
        if (!cellRect) {
            return;
        }

        const coord = findCoordByRect(coordRectMap.current!, cellRect);
        if (!coord) {
            return;
        }

        const nextSelectedCell = {
            col: coord.col,
            row: coord.row,
            doNotScrollX: !dragging.value.columns,
            doNotScrollY: !dragging.value.rows,
        };

        selectedCell.set(nextSelectedCell);
    });

    const stopDragSelect = useRef(() => {
        if (isDraggingRef.current) {

            dragging.set({
                columns: false,
                rows: false,
                active: false,
            });
        }

        isDraggingRef.current = false;
    });

    useEffect(() => {
        const unwatchSelectRange = selectedRange.watch((nextSelectedRange) => {
            setSelectionRect(() => {
                if (!nextSelectedRange) {
                    return null;
                }

                const rectA = findFromRectMap(coordRectMap.current, activeCell.value!)!;
                const rectB = findFromRectMap(coordRectMap.current, selectedCell.value!)!;

                return mergeRects(rectA, rectB);
            });
        });

        const unwatchActiveCell = activeCell.watch((nextActiveCell) => {
            setActiveRect(() => {
                if (!nextActiveCell) {
                    return null;
                }

                const rect = findFromRectMap(coordRectMap.current, nextActiveCell);
                return rect;
            });
        });

        return () => {
            unwatchSelectRange();
            unwatchActiveCell();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRange]);

    const doubleClick = useRef((event: MouseEvent) => {
        const clickOutside = !containerRef.current?.contains(event.target as Node);
        if (clickOutside) {
            cleanSelection();
            return;
        }

        const clickedOnActiveCell = activeCell.value && event.target === coordElementMap.current.get(activeCell.value);
        if (clickedOnActiveCell) {
            return;
        }

        if (activeCell.value) {
            cleanSelection({ maintainActiveCell: true });
            editing.set(true);
            event.preventDefault();
        }
    });

    useDocumentEventListener('mousedown', startDragSelect.current);
    useDocumentEventListener('mousemove', onMouseMove.current);
    useDocumentEventListener('mouseup', stopDragSelect.current);
    useDocumentEventListener('dblclick', doubleClick.current);

    return {
        containerRef: containerRef as RefObject<any>,
        rect: selectionRect,
        activeRect,
        registerCellRef: registerCell
    };
};
