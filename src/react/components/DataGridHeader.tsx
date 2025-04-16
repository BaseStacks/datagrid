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

    const widthRef = useRef<number>(0);
    const Component = as || 'div' as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            height: '100%',
        };
    }, [props.style]);

    useLayoutEffect(() => {
        const unwatchColumnLayout = dataGrid.layout.columns.watch((columns) => {
            if (!ref.current) return;

            const columnLayout = columns.get(header.id);
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
