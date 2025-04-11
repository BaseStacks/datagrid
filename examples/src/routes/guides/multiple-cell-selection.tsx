import { MultipleCellSelection } from '@/components/examples/MultipleCellSelection';
import { ExampleBlock } from '@/components/layout/ExampleBlock';
import { Page } from '@/components/layout/Page';
import { createFileRoute } from '@tanstack/react-router';

import code from '@/components/examples/MultipleCellSelection.tsx?raw';

export const Route = createFileRoute('/guides/multiple-cell-selection')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <Page
            category="Guides"
            title="Cell selection"
            description="You can select multiple cells by clicking and dragging the mouse over the cells. This will create a range selection that highlights all the cells within the selected range."
        >
            <ExampleBlock
                example={<MultipleCellSelection />}
                code={code}
            />
        </Page >
    );
}
