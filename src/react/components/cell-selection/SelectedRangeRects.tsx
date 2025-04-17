import { memo } from 'react';
import { useDataGridState } from '../../hooks/atomic/useDataGridState';
import { useDataGridContext } from '../../hooks/useDataGridContext';

interface SelectedRangeRectsProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: React.ElementType;
}

function SelectedRangeRectsImpl({ as, style, ...props }: SelectedRangeRectsProps) {
    const { selection } = useDataGridContext();
    const rangeRects = useDataGridState(selection.selectedRangeRects);

    const Component = as || 'div';

    return rangeRects.map((rect, index) => (
        <Component
            {...props}
            key={index}
            style={{ ...rect, ...style, zIndex: 2 }}
        />
    ));
}

export const SelectedRangeRects = memo(SelectedRangeRectsImpl);
