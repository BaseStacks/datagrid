import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';

export interface DataGridHeaderGroupProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}


export function DataGridHeaderGroup({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridHeaderGroupProps>) {
    const { layout, options } = useDataGridContext();
    const ref = useRef<HTMLElement>(null);

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            position: 'relative',
            height: options.headerHeight,
        };
    }, [options.headerHeight, props.style]);

    useLayoutEffect(() => {
        const unwatchHeaderGroupNode = layout.layoutNodesState.watchItem('headerGroup:1', ({ item }) => {
            if (!ref.current) {
                return;
            };

            ref.current.style.width = item.size.width + 'px';
        });

        const handleScroll = () => {
            if (!ref.current) return;
            const scrollLeft = layout.scrollAreaState.value?.scrollLeft || 0;
            ref.current.style.transform = `translateX(-${scrollLeft}px)`;
        };

        let removeScrollHandler: (() => void) | undefined;

        const unwatchScrollArea = layout.scrollAreaState.watch((scrollArea) => {
            if (!scrollArea) return;
            layout.scrollAreaState.value?.addEventListener('scroll', handleScroll);
            removeScrollHandler = () => {
                scrollArea.removeEventListener('scroll', handleScroll);
            };
        });

        return () => {
            unwatchHeaderGroupNode();
            unwatchScrollArea();
            removeScrollHandler?.();
        };
    }, [layout.layoutNodesState, layout.scrollAreaState, ref]);

    useEffect(() => {
        layout.registerNode('headerGroup:1', ref.current!);
        return () => {
            layout.removeNode('headerGroup:1');
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
