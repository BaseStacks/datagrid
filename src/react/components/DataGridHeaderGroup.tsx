import { useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import type { LayoutPlugin } from '../../core';

export interface DataGridHeaderGroupProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
    readonly layout: LayoutPlugin;
}

export function DataGridHeaderGroup({
    as = 'div',
    layout,
    ...props
}: React.PropsWithChildren<DataGridHeaderGroupProps>) {
    const dataGrid = useDataGridContext();
    const ref = useRef<HTMLElement>(null);

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            position: 'relative',
            height: dataGrid.options.headerHeight,
        };
    }, [dataGrid.options.headerHeight, props.style]);

    useLayoutEffect(() => {
        const unwatchColumnLayout = layout.state.columns.watch((columns) => {
            if (!ref.current) return;

            ref.current.style.width = columns.values().reduce((acc, column) => acc + column.width, 0) + 'px';
        });

        return () => {
            unwatchColumnLayout();
        };
    }, [layout.state.columns, ref]);

    return (
        <Component
            {...props}
            ref={ref}
            style={style}
        />
    );
};
