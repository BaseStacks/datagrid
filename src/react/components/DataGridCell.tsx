import { useEffect, useLayoutEffect, useMemo } from 'react';
import { type Cell } from '../../core';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

interface DataGridCellProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
    readonly cell: Cell;
}

export function DataGridCell<TElement extends HTMLElement = HTMLElement>({ as, cell, children, ...props }: DataGridCellProps<TElement>) {
    const { layout, state } = useDataGridContext();
    const ref = React.createRef<TElement>();

    const Component = as || 'div' as React.ElementType;

    const style: React.CSSProperties = useMemo(() => ({
        ...props.style,
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '0',
    }), [props.style]);

    useLayoutEffect(() => {
        const unwatchColumnLayout = layout.columnLayoutsState.watchItem(cell.colId, ({ operation, item }) => {
            if (!ref.current) {
                return;
            };

            if (operation === 'remove') {
                return;
            }

            ref.current.style.width = `${item.width}px`;
            ref.current.style.left = item.left === undefined ? '' : `${item.left}px`;
            ref.current.style.right = item.right === undefined ? '' : `${item.right}px`;

            if (!item.header.column.pinned) {
                return;
            }

            if (item.header.column.pinned === 'left') {
                ref.current.style.borderRightWidth = '1px';
                ref.current.style.zIndex = '2';
            }
            else if (item.header.column.pinned === 'right') {
                ref.current.style.borderLeftWidth = '1px';
                ref.current.style.zIndex = '1';
            }
        });

        return () => {
            unwatchColumnLayout();
        };
    }, [cell.colId, layout.columnLayoutsState, ref, state.selectedRanges]);

    useEffect(() => {
        layout.registerElement(cell.id, ref.current!);
        return () => {

            layout.removeElement(cell.id);
        };
    }, [layout, cell.id, ref]);

    return (
        <Component {...props} ref={ref} style={style}>
            {children ?? cell.render()}
        </Component>
    );
};
