import { memo } from 'react';
import type { CellSelectionPlugin } from '../../../core';
import { useDataGridState } from '../../hooks/atomic/useDataGridState';

interface ActiveCellRectProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: React.ElementType;
    readonly selection: CellSelectionPlugin;
}

function ActiveCellRectImpl({ as, selection, style, ...props }: ActiveCellRectProps) {
    const activeCellRect = useDataGridState(selection.state.activeCellRect);

    const Components = as || 'div';



    return (
        <Components
            style={{ ...activeCellRect, ...style, zIndex: 10 }}
            {...props}
        />
    );
};

export const ActiveCellRect = memo(ActiveCellRectImpl);
