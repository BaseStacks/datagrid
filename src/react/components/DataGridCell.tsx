import { useEffect } from 'react';
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

    useEffect(() => {
        dataGrid.layout.registerCell(cell.id, ref.current!);
        return () => {
            dataGrid.layout.removeCell(cell.id);
        };
    }, [dataGrid.layout, cell.coordinates, cell.id, ref]);

    return (
        <Component {...props} ref={ref}>
            {children ?? cell.render()}
        </Component>
    );
};
