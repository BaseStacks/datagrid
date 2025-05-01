import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import type { ColumnHeader } from '../../host';
import { setAttributes, type DataGridHeaderNode } from '../../dom';

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
            height: '100%',
        };
    }, [props.style]);

    useLayoutEffect(() => {
        const unwatchLayout = layout.layoutNodesState.watchItem(header.id, ({ operation, item }) => {
            if (!ref.current || operation === 'remove') {
                return;
            };

            const { size, offset, pinned } = item as DataGridHeaderNode;

            let width = size.width!;

            const lastRight = pinned?.side === 'right' && pinned?.last;
            if (lastRight) {
                width += layout.scrollbarWidth;
            }

            ref.current.style.width = `${width}px`;
            ref.current.style.left = offset.left === undefined ? '' : `${offset.left}px`;

            setAttributes(ref.current, {
                'data-pinned': item.pinned?.side,
                'data-pinned-left-last': item.pinned?.side === 'left' && item.pinned?.last,
                'data-pinned-right-first': item.pinned?.side === 'right' && item.pinned?.first,
            });
        });

        return () => {
            unwatchLayout();
        };
    }, [header.id, layout.scrollbarWidth, layout.layoutNodesState]);

    useEffect(() => {
        layout.registerNode(header.id, ref.current!);
        return () => {
            layout.removeNode(header.id);
        };
    }, [layout, header.id, ref]);

    return (
        <Component {...props} ref={ref} style={style}>
            {children ?? header.render()}
        </Component>
    );
};

export const DataGridHeader = memo(DataGridHeaderImpl);
