import { useEffect } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

export interface DataGridContainerProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

export function DataGridContainer({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridContainerProps>) {
    const dataGrid = useDataGridContext();

    const Component = (as || 'div') as React.ElementType;

    const containerRef = React.createRef<HTMLElement>();

    useEffect(() => {
    }, [dataGrid.layout.container]);

    useEffect(() => {
        const container = containerRef.current!;
        container.style.setProperty('position', 'relative');
        container.style.setProperty('overflow', 'auto');

        dataGrid.layout.registerContainer(container!);

        return () => {
            dataGrid.layout.removeContainer(container!);
        };
    }, [containerRef, dataGrid.layout]);

    return (
        <Component
            {...props}
            ref={containerRef}
        />
    );
};
