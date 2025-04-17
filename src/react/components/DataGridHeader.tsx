import React, { memo, useEffect, useLayoutEffect, useMemo } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import type { ColumnHeader, LayoutPlugin } from '../../core';

interface DataGridHeaderProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
    readonly header: ColumnHeader;
    readonly layout: LayoutPlugin;
}

function DataGridHeaderImpl<TElement extends HTMLElement = HTMLElement>({ as, header, layout, children, ...props }: DataGridHeaderProps<TElement>) {
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
        const unwatchColumnLayout = layout.state.columns.watchItem(header.id, ({ operation, item }) => {
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
    }, [layout.state.columns, dataGrid.options.headerHeight, header.id, ref]);

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
