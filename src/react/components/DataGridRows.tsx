import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';

export interface DataGridRowsProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

function DataGridRowsImpl({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridRowsProps>) {
    const { layout } = useDataGridContext();
    const ref = useRef<HTMLElement>(null);

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
        };
    }, [props.style]);

    useLayoutEffect(() => {
        const unwatchRowLayouts = layout.rowLayoutsState.watch((rowLayouts) => {
            if (!ref.current) {
                return;
            };

            ref.current.style.height = rowLayouts.values().reduce((acc, rowLayout) => acc + rowLayout.height, 0) + 'px';
        });

        return () => {
            unwatchRowLayouts();
        };
    }, [layout.columnLayoutsState, layout.rowLayoutsState, layout.scrollAreaState]);

    return (
        <Component
            {...props}
            ref={ref}
            style={style}
        />
    );
};

export const DataGridRows = memo(DataGridRowsImpl);
