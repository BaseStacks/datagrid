import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import type { Row } from '../../core';

export interface DataGridRowProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
    readonly row: Row;
}

function DataGridRowImpl({
    as = 'div',
    row,
    ...props
}: React.PropsWithChildren<DataGridRowProps>) {
    const { layout, options } = useDataGridContext();
    const ref = useRef<HTMLElement>(null);

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            position: 'absolute',
            height: options.rowHeight
        };
    }, [options.rowHeight, props.style]);

    useLayoutEffect(() => {
        const unwatchColumnLayout = layout.columnLayoutsState.watch((columns) => {
            if (!ref.current) return;

            ref.current.style.width = columns.values().reduce((acc, column) => acc + column.width, 0) + 'px';
        });

        const unwatchRowLayouts = layout.rowLayoutsState.watchItem(row.id, ({ item: rowLayout }) => {
            if (!ref.current || !rowLayout) {
                return;
            }

            if (!rowLayout.pinned) {
                ref.current.style.top = rowLayout.top + 'px';
                return;
            }

            const { top, bottom } = rowLayout;
            if (top !== undefined) {
                ref.current.style.top = top + 'px';
                ref.current.style.bottom = '';
            }
            if (bottom !== undefined) {
                ref.current.style.bottom = bottom + 'px';
                ref.current.style.top = '';
            }

            if (!rowLayout.pinned) {
                ref.current.removeAttribute('data-pinned');
                ref.current.removeAttribute('data-first-top');
                ref.current.removeAttribute('data-last-top');
                ref.current.removeAttribute('data-first-bottom');
                ref.current.removeAttribute('data-last-bottom');
                return;
            }

            rowLayout.pinned && ref.current.setAttribute('data-pinned', rowLayout.pinned);
            rowLayout.firstPinnedTop && ref.current.setAttribute('data-first-top', 'true');
            rowLayout.lastPinnedTop && ref.current.setAttribute('data-last-top', 'true');
            rowLayout.firstPinnedBottom && ref.current.setAttribute('data-first-bottom', 'true');
            rowLayout.lastPinnedBottom && ref.current.setAttribute('data-last-bottom', 'true');
        });

        return () => {
            unwatchColumnLayout();
            unwatchRowLayouts();
        };
    }, [layout.columnLayoutsState, layout.rowLayoutsState, row.id]);

    useEffect(() => {
        layout.registerNode(row.id, ref.current!);
        return () => {
            layout.removeNode(row.id);
        };
    }, [layout, row.id]);

    return (
        <Component {...props} ref={ref} style={style} />
    );
};

export const DataGridRow = memo(DataGridRowImpl);
