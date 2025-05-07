import { memo, useEffect, useRef } from 'react';
import { type CellRender } from '../../host';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

interface DataGridCellContentProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
    readonly cell: CellRender;
}

function DataGridCellContentImpl<TElement extends HTMLElement = HTMLElement>({ as, cell, children, ...props }: DataGridCellContentProps<TElement>) {
    const { state, renderer } = useDataGridContext();
    const [cellEditing, setCellEditing] = React.useState(false);
    const cellEditingRef = useRef(cellEditing);
    cellEditingRef.current = cellEditing;

    const ref = useRef<TElement>(null);

    const Component = as || 'div' as React.ElementType;

    useEffect(() => {
        const unwatchEditing = state.editing.watch((editing) => {
            if (!editing && !cellEditingRef.current) {
                return;
            }

            if (!editing && cellEditingRef.current) {
                setCellEditing(false);
                return;
            }

            if (state.activeCell.value?.id !== cell.id) {
                return;
            }

            setCellEditing(editing);
        });

        return () => {
            unwatchEditing();
        };
    }, [cell.id, state.activeCell, state.editing]);

    return (
        <Component {...props} ref={ref}>
            {children ?? renderer.renderCell(cell)}
        </Component>
    );
};

export const DataGridCellContent = memo(DataGridCellContentImpl) as typeof DataGridCellContentImpl;
