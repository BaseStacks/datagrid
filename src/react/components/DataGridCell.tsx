import { useEffect, useLayoutEffect, useRef } from 'react';
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
    const widthRef = useRef<number>(0);

    const Component = as || 'div' as React.ElementType;

    useLayoutEffect(() => {
        const unwatchColumnLayout = dataGrid.layout.columns.watch((columns) => {
            if (!ref.current) return;

            const columnLayout = columns.get(cell.colId);
            if (columnLayout && columnLayout.width !== widthRef.current) {
                ref.current.style.width = `${columnLayout.width}px`;
                ref.current.style.position = 'absolute';
                ref.current.style.top = '0';
                ref.current.style.left = `${columnLayout.left}px`;
                widthRef.current = columnLayout.width;
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
        <Component {...props} ref={ref}>
            {children ?? cell.render()}
        </Component>
    );
};
