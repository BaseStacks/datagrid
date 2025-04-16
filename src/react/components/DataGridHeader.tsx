import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import type { ColumnHeader } from '../../core';

interface DataGridHeaderProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
    readonly header: ColumnHeader;
}

function DataGridHeaderImpl<TElement extends HTMLElement = HTMLElement>({ as, header, children, ...props }: DataGridHeaderProps<TElement>) {
    const ref = React.createRef<TElement>();
    const dataGrid = useDataGridContext();

    const Component = as || 'div' as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
        };
    }, [props.style]);

    useLayoutEffect(() => {
        const unwatchColumnLayout = dataGrid.layout.columns.watch((columns) => {
            if (!ref.current) return;

            const columnLayout = columns.get(header.id);
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
    }, [dataGrid.layout.columns, dataGrid.options.headerHeight, header.id, ref]);

    useEffect(() => {
        dataGrid.layout.registerElement(header.id, ref.current!);

        return () => {
            dataGrid.layout.removeElement(header.id);
        };
    }, [dataGrid.layout, header.id, ref]);

    return (
        <Component {...props} ref={ref} style={style}>
            {children ?? header.render()}
        </Component>
    );
};

export const DataGridHeader = memo(DataGridHeaderImpl);
