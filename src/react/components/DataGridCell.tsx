import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { type Cell } from '../../core';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

interface DataGridCellProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
    readonly cell: Cell;
}

export function DataGridCell<TElement extends HTMLElement = HTMLElement>({ as, cell, children, ...props }: DataGridCellProps<TElement>) {
    const ref = React.createRef<TElement>();
    const dataGrid = useDataGridContext();

    const Component = as || 'div' as React.ElementType;

    const style: React.CSSProperties = useMemo(() => ({
        ...props.style,
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
    }), [props.style]);

    useLayoutEffect(() => {
        const unwatchColumnLayout = dataGrid.layout.columns.watch((columns) => {
            if (!ref.current) return;

            const columnLayout = columns.get(cell.colId);
            if (columnLayout) {
                ref.current.style.width = `${columnLayout.width}px`;
                ref.current.style.left = `${columnLayout.left}px`;
                if (columnLayout.header.column.pinned) {
                    ref.current.style.zIndex = '1';
                    ref.current.style.borderRightWidth = '1px';
                }
            }
        });

        return () => {
            unwatchColumnLayout();
        };
    }, [cell.colId, dataGrid.layout.columns, ref]);

    useEffect(() => {
        dataGrid.layout.registerElement(cell.id, ref.current!);
        return () => {
            dataGrid.layout.removeElement(cell.id);
        };
    }, [dataGrid.layout, cell.id, ref]);

    return (
        <Component {...props} ref={ref} style={style}>
            {children ?? cell.render()}
        </Component>
    );
};
