import { memo } from 'react';
import { useDataGridState } from '../../hooks/atomic/useDataGridState';
import { useDataGridContext } from '../../hooks/useDataGridContext';

interface ActiveCellRectProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: React.ElementType;
}

function ActiveCellRectImpl({ as, style, ...props }: ActiveCellRectProps) {
    const { selection } = useDataGridContext();
    const activeCellRect = useDataGridState(selection.activeCellRect);

    const Components = as || 'div';

    return (
        <Components
            style={{ ...activeCellRect, ...style, zIndex: 10 }}
            {...props}
        />
    );
};

export const ActiveCellRect = memo(ActiveCellRectImpl);
