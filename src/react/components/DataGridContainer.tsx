import { memo, useEffect, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

export interface DataGridContainerProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

function DataGridContainerImpl({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridContainerProps>) {
    const dataGrid = useDataGridContext();

    const Component = (as || 'div') as React.ElementType;

    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const container = containerRef.current!;
        dataGrid.layout.registerContainer(container!);

        return () => {
            dataGrid.layout.removeContainer(container!);
        };
    }, [dataGrid.layout]);

    return (
        <Component
            {...props}
            ref={containerRef}
        />
    );
};

export const DataGridContainer = memo(DataGridContainerImpl) as typeof DataGridContainerImpl;

