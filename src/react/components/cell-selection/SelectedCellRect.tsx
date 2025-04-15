import { memo } from 'react';
import type { CellSelectionPlugin } from '../../../core';
import { useDataGridState } from '../../hooks/atomic/useDataGridState';

interface SelectedCellProps extends React.HTMLAttributes<HTMLElement> {
    readonly as?: React.ElementType;
    readonly selection: CellSelectionPlugin;
}

function SelectedCellRectImpl({ as, selection, style, ...props }: SelectedCellProps) {
    const activeCellRect = useDataGridState(selection.state.activeCellRect);

    const Components = as || 'div';

    return (
        <Components
            style={{ ...activeCellRect, ...style }}
            {...props}
        />
    );
};

export const SelectedCellRect = memo(SelectedCellRectImpl);
