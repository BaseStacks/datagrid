import { memo, useEffect, useRef } from 'react';
import { useDataGridState } from '../../hooks/atomic/useDataGridState';
import { useDataGridContext } from '../../hooks/useDataGridContext';
interface SelectedRangeRectsProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: React.ElementType;
}

function SelectedRangeRectsImpl({ as, style, ...props }: SelectedRangeRectsProps) {
    const { selection } = useDataGridContext();
    const rangeRects = useDataGridState(selection.selectedRangeRects);

    const refMap = useRef<Map<number, HTMLDivElement>>(new Map());
    const collectRef = (index: number, element: HTMLElement) => {
        if (element) {
            refMap.current.set(index, element as HTMLDivElement);
        } else {
            refMap.current.delete(index);
        }
    };

    useEffect(() => {
        const unwatchRects = selection.selectedRangeRects.watch((rects) => {
            rects.forEach((rect, index) => {
                const element = refMap.current.get(index);
                if (!element) {
                    return;
                }

                const { left, top, width, height } = rect;
                element.style.left = `${left}px`;
                element.style.top = `${top}px`;
                element.style.width = `${width}px`;
                element.style.height = `${height}px`;
                element.style.zIndex = rect.zIndex ? rect.zIndex.toString() : '1';
            });
        });

        return () => {
            unwatchRects();
        };
    }, [selection.dragging, selection.selectedRangeRects]);

    const Component = as || 'div';

    return rangeRects.map((_rect, index) => (
        <Component
            {...props} key={index}
            style={{ ...style, zIndex: 1 }}
            ref={(element: HTMLElement) => collectRef(index, element)}
        />
    ));
}

export const SelectedRangeRects = memo(SelectedRangeRectsImpl);
