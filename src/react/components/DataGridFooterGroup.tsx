import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';

export interface DataGridFooterGroupProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: string;
}


export function DataGridFooterGroup({
    as = 'div',
    ...props
}: React.PropsWithChildren<DataGridFooterGroupProps>) {
    const { layout, options } = useDataGridContext();
    const ref = useRef<HTMLElement>(null);

    const Component = (as || 'div') as React.ElementType;

    const style: React.CSSProperties = useMemo(() => {
        return {
            ...props.style,
            position: 'relative',
            height: options.footerHeight,
        };
    }, [options.footerHeight, props.style]);

    useLayoutEffect(() => {
        const unwatchFooterGroupNode = layout.layoutNodesState.watchItem('footerGroup:1', ({ item }) => {
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
            unwatchFooterGroupNode();
            unwatchScrollArea();
            removeScrollHandler?.();
        };
    }, [layout.layoutNodesState, layout.scrollAreaState, ref]);

    useEffect(() => {
        layout.registerNode('footerGroup:1', ref.current!);
        return () => {
            layout.removeNode('footerGroup:1');
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
