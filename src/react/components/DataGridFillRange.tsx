import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

export interface DataGridFillRangeProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

function DataGridFillRangeImpl({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridFillRangeProps>) {
    const { layout } = useDataGridContext();

    const Component = (as || 'div') as React.ElementType;

    const ref = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        layout.layoutNodesState.watchItem('fillRange', ({ item }) => {
            if (!item || !ref.current) {
                return;
            }

            const { offset, size, visible } = item;
            if (!visible) {
                ref.current.style.display = 'none';
                return;
            }

            ref.current.style.display = 'block';
            ref.current.style.position = 'absolute';
            ref.current.style.left = `${offset.left}px`;
            ref.current.style.top = `${offset.top}px`;
            ref.current.style.width = `${size.width}px`;
            ref.current.style.height = `${size.height}px`;
        });
    }, [layout.layoutNodesState]);

    useEffect(() => {
        const fillRange = ref.current!;
        fillRange.style.display = 'none';
        fillRange.style.position = 'absolute';
        fillRange.style.pointerEvents = 'none';
        layout.registerNode('fillRange', fillRange!);

        return () => {
            layout.removeNode('fillRange');
        };
    }, [layout]);

    return (
        <Component
            {...props}
            ref={ref}
        />
    );
};

export const DataGridFillRange = memo(DataGridFillRangeImpl) as typeof DataGridFillRangeImpl;

