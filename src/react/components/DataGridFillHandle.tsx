import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

export interface DataGridFillHandleProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

function DataGridFillHandleImpl({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridFillHandleProps>) {
    const { layout } = useDataGridContext();

    const Component = (as || 'div') as React.ElementType;

    const ref = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        layout.layoutNodesState.watchItem('fillHandler', ({ item }) => {
            if (!item || !ref.current) {
                return;
            }

            const { offset, visible } = item;
            if (!visible) {
                ref.current.style.display = 'none';
                return;
            }

            ref.current.style.display = 'block';

            ref.current.style.left = `${offset.left}px`;
            ref.current.style.top = `${offset.top}px`;
        });
    }, [layout.layoutNodesState]);

    useEffect(() => {
        const fillHandler = ref.current!;

        fillHandler.style.display = 'none';
        fillHandler.style.position = 'absolute';

        layout.registerNode('fillHandler', fillHandler!);

        return () => {
            layout.removeNode('fillHandler');
        };
    }, [layout]);

    return (
        <Component
            {...props}
            ref={ref}
        />
    );
};

export const DataGridFillHandle = memo(DataGridFillHandleImpl) as typeof DataGridFillHandleImpl;

