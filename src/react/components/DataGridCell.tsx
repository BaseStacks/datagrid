import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { type CellRender } from '../../host';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';
import { setAttributes } from '../../dom';

interface DataGridCellProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
    readonly cell: CellRender;
}

function DataGridCellImpl<TElement extends HTMLElement = HTMLElement>({ as, cell, children, ...props }: DataGridCellProps<TElement>) {
    const { layout, state } = useDataGridContext();
    const ref = useRef<TElement>(null);

    const Component = as || 'div' as React.ElementType;

    const style: React.CSSProperties = useMemo(() => ({
        ...props.style,
        position: 'absolute',
        top: '0',
        height: '100%',
    }), [props.style]);

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
            console.log('selectedRanges', selectedRanges);
            
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

        return () => {
            unwatchCell();
            unwatchActiveCell();
            unwatchSelectedRanges();
        };
    }, [cell.id, layout.layoutNodesState, state.activeCell, state.selectedRanges]);

    useEffect(() => {
        layout.registerNode(cell.id, ref.current!);
        return () => {
            layout.removeNode(cell.id);
        };
    }, [layout, cell.id]);

    return (
        <Component {...props} ref={ref} style={style}>
            {children ?? cell.render()}
        </Component>
    );
};

export const DataGridCell = memo(DataGridCellImpl) as typeof DataGridCellImpl;
