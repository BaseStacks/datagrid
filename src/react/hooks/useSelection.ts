import { useCallback, useEffect, useRef, useState } from 'react';
import type { Cell, CellCoordinates, RowData } from '../../core';
import { findRect, getCursorOffset, getRect, RectType } from '../utils/domRectUtils';
import { useDocumentEventListener } from './dom/useDocumentEventListener';
import type { UseDataGridReturn } from './useDataGrid';

export const useSelection = <TRow extends RowData>(dataGrid: UseDataGridReturn<TRow>) => {
    const { dragging, activeCell, selectedCell, selectedRange, cleanSelection } = dataGrid;

    const cellRectRefs = useRef<Map<Cell, RectType | null>>(new Map());
    const cellRefs = useRef<Map<Cell, HTMLElement | null>>(new Map());
    const registerCellRef = useCallback((cell: Cell) => (element: HTMLElement | null) => {
        cellRefs.current.set(cell, element);
    }, []);

    const containerRef = useRef<HTMLElement>(null);
    const isDraggingRef = useRef(false);

    const [selectionRect, setSelectionRect] = useState<RectType | null>(null);

    const buildRectMap = useCallback(() => {
        const rectMap = new Map<Cell, RectType | null>();
        cellRefs.current.forEach((element, cell) => {
            if (element) {
                rectMap.set(cell, getRect(containerRef.current!, element));
            } else {
                rectMap.set(cell, null);
            }
        });
        return rectMap;
    }, []);

    const findCellByRect = useCallback((rect: RectType) => {
        for (const [cell, cellRect] of cellRectRefs.current.entries()) {
            if (cellRect && cellRect.left === rect.left && cellRect.top === rect.top) {
                return cell;
            }
        }
        return null;
    }, []);

    const startDragSelect = useRef((event: MouseEvent) => {
        const clickInside = containerRef.current?.contains(event.target as Node) || false;
        if (!clickInside) {
            cleanSelection();
            return;
        }

        cleanSelection(true);

        cellRectRefs.current = buildRectMap();
        const cursorOffset = getCursorOffset(event, containerRef.current!);
        const cellRect = findRect(cursorOffset, [...cellRectRefs.current.values()]);
        if (!cellRect) {
            return;
        }

        const cell = findCellByRect(cellRect);
        if (!cell) {
            return;
        }

        event.preventDefault();

        activeCell.set(cell.coordinates);

        isDraggingRef.current = true;

        setTimeout(() => {
            if (!isDraggingRef.current) {
                return;
            }


            dragging.set({
                columns: cell.coordinates.col !== -1,
                rows: cell.coordinates.row !== -1,
                active: true,
            });
        }, 150);
    });

    const onMouseMove = useRef((event: MouseEvent) => {
        if (!isDraggingRef.current) {
            return;
        }

        const cursorOffset = getCursorOffset(event, containerRef.current!);
        const cellRect = findRect(cursorOffset, [...cellRectRefs.current.values()]);
        if (!cellRect) {
            return;
        }

        const cell = findCellByRect(cellRect);
        if (!cell) {
            return;
        }

        const nextSelectedCell = {
            col: cell.coordinates.col,
            row: cell.coordinates.row,
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
        const findFromRectMap = (coordinates: CellCoordinates) => {
            const pair = cellRectRefs.current.entries().find(([cell, rect]) => {
                return cell.coordinates.col === coordinates.col && cell.coordinates.row === coordinates.row && rect;
            });

            return pair ? pair[1] : null;
        };

        const unwatch = selectedRange.watch((nextSelectedRange) => {
            setSelectionRect(() => {
                if (!nextSelectedRange) {
                    return null;
                }

                const rectOfActive = findFromRectMap(activeCell.value!);
                const rectOfSelected = findFromRectMap(selectedCell.value!);

                return {
                    left: Math.min(rectOfActive!.left, rectOfSelected!.left),
                    top: Math.min(rectOfActive!.top, rectOfSelected!.top),
                    width: Math.abs(rectOfActive!.left - rectOfSelected!.left) + Math.max(rectOfActive!.width, rectOfSelected!.width),
                    height: Math.abs(rectOfActive!.top - rectOfSelected!.top) + Math.max(rectOfActive!.height, rectOfSelected!.height)
                };
            });
        });

        return () => {
            unwatch();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRange]);

    useDocumentEventListener('mousedown', startDragSelect.current);
    useDocumentEventListener('mousemove', onMouseMove.current);
    useDocumentEventListener('mouseup', stopDragSelect.current);

    return {
        containerRef: containerRef as React.RefObject<any>,
        rect: selectionRect,
        registerCellRef
    };
};
