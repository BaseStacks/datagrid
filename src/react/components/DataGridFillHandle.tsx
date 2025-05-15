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
        layout.layoutNodesState.watchItem('fillHandle', ({ item }) => {
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
            ref.current.style.zIndex = offset.z?.toString() ?? '0';
        });
    }, [layout.layoutNodesState]);

    useEffect(() => {
        const fillHandle = ref.current!;

        fillHandle.style.display = 'none';
        fillHandle.style.position = 'absolute';

        layout.registerNode('fillHandle', fillHandle!);

        return () => {
            layout.removeNode('fillHandle');
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

