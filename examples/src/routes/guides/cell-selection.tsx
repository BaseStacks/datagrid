import { CellSelection } from '@/components/examples/CellSelection';
import { ExampleBlock } from '@/components/layout/ExampleBlock';
import { Page } from '@/components/layout/Page';
import { createFileRoute } from '@tanstack/react-router';

import code from '@/components/examples/CellSelection.tsx?raw';

export const Route = createFileRoute('/guides/cell-selection')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <Page
            category="Guides"
            title="Cell selection"
            description="Simple cell selection guide. This example demonstrates how to select a cell in the data grid. The selected cell is highlighted with a blue outline."
        >
            <ExampleBlock
                example={<CellSelection />}
                code={code}
            />
        </Page >
    );
}
