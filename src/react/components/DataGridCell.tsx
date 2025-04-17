import { useEffect, useLayoutEffect, useMemo } from 'react';
import { LayoutPlugin, type Cell } from '../../core';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

interface DataGridCellProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
    readonly cell: Cell;
    readonly layout: LayoutPlugin;
}

export function DataGridCell<TElement extends HTMLElement = HTMLElement>({ as, cell, layout, children, ...props }: DataGridCellProps<TElement>) {
    const dataGrid = useDataGridContext();
    const ref = React.createRef<TElement>();

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
        const unwatchColumnLayout = layout.state.columns.watchItem(cell.colId, ({ operation, item }) => {
            if (!ref.current) {
                return;
            };

            if (operation === 'remove') {
                return;
            }

            ref.current.style.width = `${item.width}px`;
            ref.current.style.left = item.left === undefined ? '' : `${item.left}px`;
            ref.current.style.right = item.right === undefined ? '' : `${item.right}px`;

            if (item.header.column.pinned) {
                ref.current.style.zIndex = '1';

                if (item.header.column.pinned === 'left') {
                    ref.current.style.borderRightWidth = '1px';
                }
                else if (item.header.column.pinned === 'right') {
                    ref.current.style.borderLeftWidth = '1px';
                }
            }
        });

        return () => {
            unwatchColumnLayout();
        };
    }, [cell.colId, layout.state.columns, ref]);

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
