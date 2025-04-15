import { useLayoutEffect } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';

export interface DataGridContainerProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

export function DataGridContainer({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridContainerProps>) {
    const dataGrid = useDataGridContext();

    const Component = (as || 'div') as React.ElementType;

    useLayoutEffect(() => {
        dataGrid.layout.container?.style.setProperty('position', 'relative');
    }, [dataGrid.layout.container]);

    return (
        <Component
            ref={dataGrid.layout.registerContainer}
            {...props}
        />
    );
};
