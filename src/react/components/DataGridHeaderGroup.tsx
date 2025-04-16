import { useMemo } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';

export interface DataGridHeaderGroupProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

export function DataGridHeaderGroup({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridHeaderGroupProps>) {
    const dataGrid = useDataGridContext();

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            position: 'relative',
            height: dataGrid.options.headerHeight,
        };
    }, [dataGrid.options.headerHeight, props.style]);

    return (
        <Component
            {...props}
            style={style}
        />
    );
};
