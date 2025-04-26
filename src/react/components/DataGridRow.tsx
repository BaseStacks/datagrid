import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import type { Row } from '../../core';
import { setAttributes } from '../../dom';

export interface DataGridRowProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
    readonly row: Row;
}

function DataGridRowImpl({
    as = 'div',
    row,
    ...props
}: React.PropsWithChildren<DataGridRowProps>) {
    const { layout } = useDataGridContext();
    const ref = useRef<HTMLElement>(null);

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            position: 'absolute'
        };
    }, [props.style]);

    useLayoutEffect(() => {
        const unwatchRowLayouts = layout.layoutNodesState.watchItem(row.id, ({ item }) => {
            if (!ref.current || !item) {
                return;
            }

            const { offset, size } = item;

            ref.current.style.width = size.width + 'px';
            ref.current.style.height = size.height + 'px';

            if (offset.top !== undefined) {
                ref.current.style.top = offset.top + 'px';
                ref.current.style.bottom = '';
            }
            else if (offset.bottom !== undefined) {
                ref.current.style.bottom = offset.bottom + 'px';
                ref.current.style.top = '';
            }

            setAttributes(ref.current, item.attributes);
        });

        return () => {
            unwatchRowLayouts();
        };
    }, [layout.columnLayoutsState, layout.layoutNodesState, row.id]);

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
