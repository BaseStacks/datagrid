import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { type CellRender } from '../../host';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';
import { setAttributes } from '../../dom';

interface DataGridCellProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
    readonly cell: CellRender;
}

function DataGridCellImpl<TElement extends HTMLElement = HTMLElement>({ as, cell, ...props }: DataGridCellProps<TElement>) {
    const { layout, state } = useDataGridContext();

    const ref = useRef<TElement>(null);

    const Component = as || 'div' as React.ElementType;

    useLayoutEffect(() => {
        const unwatchCell = layout.layoutNodesState.watchItem(cell.id, ({ operation, item }) => {
            if (!ref.current || operation === 'remove') {
                return;
            };

            const { size, offset } = item;

            ref.current.style.width = `${size.width}px`;
            ref.current.style.left = offset.left === undefined ? '' : `${offset.left}px`;

            setAttributes(ref.current, {
                'data-pinned': item.pinned?.side,
                'data-pinned-left-last': item.pinned?.side === 'left' && item.pinned?.last,
                'data-pinned-right-first': item.pinned?.side === 'right' && item.pinned?.first,
            });
        });

        const unwatchActiveCell = state.activeCell.watch((activeCell) => {
            if (!ref.current) {
                return;
            }

            setAttributes(ref.current, {
                'data-active': activeCell?.id === cell.id,
            });
        });

        const unwatchSelectedRanges = state.selectedRanges.watch((selectedRanges) => {
            if (!ref.current) {
                return;
            }

            const edges: Set<string> = new Set();
            let hasSelectedRange = false;

            selectedRanges.forEach(selectedRange => {
                const cellInRange = selectedRange.cells.get(cell.id);
                if (!cellInRange) {
                    return;
                }
                hasSelectedRange = true;
                if (cellInRange.edges.length) {
                    cellInRange.edges.forEach(edge => {
                        edges.add(edge);
                    });
                }
            });

            setAttributes(ref.current, {
                'data-edge-top': edges.has('top'),
                'data-edge-bottom': edges.has('bottom'),
                'data-edge-left': edges.has('left'),
                'data-edge-right': edges.has('right'),
                'data-selected': hasSelectedRange,
            });
        });

        const unwatchEditing = state.editing.watch((editing) => {
            if (!ref.current) {
                return;
            }

            if (editing && state.activeCell.value?.id === cell.id) {
                setAttributes(ref.current, {
                    'data-editing': editing,
                });
            }
            else {
                setAttributes(ref.current, {
                    'data-editing': null,
                });
            }
        });

        return () => {
            unwatchCell();
            unwatchActiveCell();
            unwatchSelectedRanges();
            unwatchEditing();
        };
    }, [cell.id, layout.layoutNodesState, state.activeCell, state.editing, state.selectedRanges]);

    useEffect(() => {
        layout.registerNode(cell.id, ref.current!);
        ref.current!.style.position = 'absolute';
        ref.current!.style.top = '0';
        ref.current!.style.height = '100%';

        return () => {
            layout.removeNode(cell.id);
        };
    }, [layout, cell.id]);

    return (
        <Component {...props} ref={ref} />
    );
};

export const DataGridCell = memo(DataGridCellImpl) as typeof DataGridCellImpl;
