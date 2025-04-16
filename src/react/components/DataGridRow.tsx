import { memo, useMemo } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';

export interface DataGridRowProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

function DataGridRowImpl({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridRowProps>) {
    const dataGrid = useDataGridContext();

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            position: 'relative',
            height: dataGrid.options.rowHeight,
        };
    }, [dataGrid.options.rowHeight, props.style]);

    return (
        <Component
            {...props}
            style={style}
        />
    );
};

export const DataGridRow = memo(DataGridRowImpl);
