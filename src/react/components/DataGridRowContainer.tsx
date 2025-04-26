import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';

export interface DataGridRowContainerProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}

function DataGridRowContainerImpl({ as = 'div', ...props }: React.PropsWithChildren<DataGridRowContainerProps>) {
    const { layout } = useDataGridContext();
    const ref = useRef<HTMLElement>(null);

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
        };
    }, [props.style]);

    useLayoutEffect(() => {
        const unwatchRowLayouts = layout.layoutNodesState.watchItem('rowContainer:1', ({ item }) => {
            if (!ref.current || !item) {
                return;
            };

            ref.current.style.height = item.rect.height + 'px';
            ref.current.style.width = item.rect.width + 'px';
        });

        return () => {
            unwatchRowLayouts();
        };
    }, [layout.layoutNodesState]);

    useEffect(() => {
        layout.registerNode('rowContainer:1', ref.current!);
        return () => {
            layout.removeNode('rowContainer:1');
        };
    }, [layout]);

    return (
        <Component
            {...props}
            ref={ref}
            style={style}
        />
    );
};

export const DataGridRowContainer = memo(DataGridRowContainerImpl);
