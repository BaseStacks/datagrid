import { memo, useEffect, useRef } from 'react';
import { useDataGridContext } from '../../hooks/useDataGridContext';

interface ActiveCellRectProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: React.ElementType;
}

function ActiveCellRectImpl({ as, style, ...props }: ActiveCellRectProps) {
    const { selection } = useDataGridContext();

    const ref = useRef<HTMLDivElement>(null);

    const Components = as || 'div';

    useEffect(() => {
        const unwatch = selection.activeCellRect.watch((rect) => {
            if (!rect || !ref.current) {
                return;
            }

            const { left, top, width, height } = rect;
            ref.current.style.left = `${left}px`;
            ref.current.style.top = `${top}px`;
            ref.current.style.width = `${width}px`;
            ref.current.style.height = `${height}px`;
        });
        return () => {
            unwatch();
        };
    }, [selection.activeCellRect]);

    return (
        <Components
            {...props}
            ref={ref}
            style={{ ...style, zIndex: 10 }}
        />
    );
};

export const ActiveCellRect = memo(ActiveCellRectImpl);
