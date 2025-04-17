import { memo } from 'react';
import { useDataGridState } from '../../hooks/atomic/useDataGridState';
import { useDataGridContext } from '../../hooks/useDataGridContext';

interface SelectionBackdropProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: React.ElementType;
}

function SelectionBackdropImpl({
    as,
    style,
    ...props
}: SelectionBackdropProps) {
    const { selection } = useDataGridContext();
    const dragging = useDataGridState(selection.dragging);

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
                zIndex: 2,
                ...style
            }}
            {...props}
        />
    );
};

export const SelectionBackdrop = memo(SelectionBackdropImpl);
