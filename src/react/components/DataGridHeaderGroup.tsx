import { useLayoutEffect, useMemo, useRef } from 'react';
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
        const unwatchColumnLayout = layout.columnLayoutsState.watch((columns) => {
            if (!ref.current) {
                return;
            };

            ref.current.style.width = columns.values().reduce((acc, column) => acc + column.width, 0) + 'px';
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
            unwatchColumnLayout();
            unwatchScrollArea();
            removeScrollHandler?.();
        };
    }, [layout.columnLayoutsState, layout.scrollAreaState, ref]);

    return (
        <Component
            {...props}
            ref={ref}
            style={style}
        />
    );
};
