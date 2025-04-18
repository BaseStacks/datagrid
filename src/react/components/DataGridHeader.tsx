import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import type { ColumnHeader } from '../../core';

interface DataGridHeaderProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
    readonly header: ColumnHeader;
}

function DataGridHeaderImpl<TElement extends HTMLElement = HTMLElement>({ as, header, children, ...props }: DataGridHeaderProps<TElement>) {
    const ref = useRef<TElement>(null);
    const { layout } = useDataGridContext();

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
        const unwatchColumnLayout = layout.columnLayoutsState.watchItem(header.id, ({ operation, item }) => {
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
    }, [layout.columnLayoutsState, header.id]);

    useEffect(() => {
        layout.registerNode(header.id, ref.current!);
        return () => {
            layout.removeElement(header.id);
        };
    }, [layout, header.id, ref]);

    return (
        <Component {...props} ref={ref} style={style}>
            {children ?? header.render()}
        </Component>
    );
};

export const DataGridHeader = memo(DataGridHeaderImpl);
