import { useEffect, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

export interface DataGridScrollAreaProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

export function DataGridScrollArea({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridScrollAreaProps>) {
    const dataGrid = useDataGridContext();

    const Component = (as || 'div') as React.ElementType;

    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const container = containerRef.current!;
        container.style.setProperty('position', 'relative');
        container.style.setProperty('overflow', 'auto');

        dataGrid.layout.registerScrollArea(container!);

        return () => {
            dataGrid.layout.removeScrollArea(container!);
        };
    }, [dataGrid.layout]);

    return (
        <Component
            {...props}
            ref={containerRef}
        />
    );
};
