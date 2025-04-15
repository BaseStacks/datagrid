import { createFileRoute } from '@tanstack/react-router';

import CellSelection from '@/contents/core-features/CellSelection.mdx';

export const Route = createFileRoute('/plugins/cell-selection')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <CellSelection />
    );
}
