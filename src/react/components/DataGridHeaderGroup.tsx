import { useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';

export interface DataGridHeaderGroupProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

export function DataGridHeaderGroup({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridHeaderGroupProps>) {
    const { layout, options } = useDataGridContext();
    const ref = useRef<HTMLElement>(null);

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            position: 'relative',
            height: options.headerHeight,
        };
    }, [options.headerHeight, props.style]);

    useLayoutEffect(() => {
        const unwatchColumnLayout = layout.columnLayoutsState.watch((columns) => {
            if (!ref.current) return;

            ref.current.style.width = columns.values().reduce((acc, column) => acc + column.width, 0) + 'px';
        });

        return () => {
            unwatchColumnLayout();
        };
    }, [layout.columnLayoutsState, ref]);

    return (
        <Component
            {...props}
            ref={ref}
            style={style}
        />
    );
};
