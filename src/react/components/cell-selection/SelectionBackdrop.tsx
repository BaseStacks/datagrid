import { memo } from 'react';
import type { CellSelectionPlugin } from '../../../core';
import { useDataGridState } from '../../hooks/atomic/useDataGridState';

interface SelectionBackdropProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: React.ElementType;
    readonly selection: CellSelectionPlugin;
}

function SelectionBackdropImpl({
    as,
    selection,
    style,
    ...props
}: SelectionBackdropProps) {
    const dragging = useDataGridState(selection.state.dragging);

    if (!dragging) {
        return null;
    }

    const Component = as || 'div';

    return (
        <Component
            style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                ...style
            }}
            {...props}
        />
    );
};

export const SelectionBackdrop = memo(SelectionBackdropImpl);
