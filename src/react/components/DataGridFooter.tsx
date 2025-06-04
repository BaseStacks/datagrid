import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import type { ColumnFooter } from '../../host';
import { setAttributes, type DataGridFooterNode } from '../../dom';

interface DataGridFooterProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
    readonly footer: ColumnFooter;
}

function DataGridFooterImpl<TElement extends HTMLElement = HTMLElement>({ as, footer, children, ...props }: DataGridFooterProps<TElement>) {
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
        const unwatchLayout = layout.layoutNodesState.watchItem(footer.id, ({ operation, item }) => {
            if (!ref.current || operation === 'remove') {
                return;
            };

            const { size, offset, pinned } = item as DataGridFooterNode;

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
    }, [footer.id, layout.scrollbarWidth, layout.layoutNodesState]);

    useEffect(() => {
        layout.registerNode(footer.id, ref.current!);
        return () => {
            layout.removeNode(footer.id);
        };
    }, [layout, footer.id, ref]);

    return (
        <Component {...props} ref={ref} style={style}>
            {children ?? footer.render()}
        </Component>
    );
};

export const DataGridFooter = memo(DataGridFooterImpl);
