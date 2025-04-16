import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';

export interface DataGridRowProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

function DataGridRowImpl({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridRowProps>) {
    const dataGrid = useDataGridContext();
    const ref = useRef<HTMLElement>(null);

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            position: 'relative',
            height: dataGrid.options.rowHeight,
        };
    }, [dataGrid.options.rowHeight, props.style]);

    useLayoutEffect(() => {
        const unwatchColumnLayout = dataGrid.layout.columns.watch((columns) => {
            if (!ref.current) return;

            ref.current.style.width = columns.values().reduce((acc, column) => acc + column.width, 0) + 'px';
        });

        return () => {
            unwatchColumnLayout();
        };
    }, [dataGrid.layout.columns, ref]);

    return (
        <Component
            {...props}
            ref={ref}
            style={style}
        />
    );
};

export const DataGridRow = memo(DataGridRowImpl);
