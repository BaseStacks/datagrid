import { EditableData } from '@/components/examples/EditableData';
import { ExampleBlock } from '@/components/layout/ExampleBlock';
import { Page } from '@/components/layout/Page';
import { createFileRoute } from '@tanstack/react-router';

import code from '@/components/examples/EditableData.tsx?raw';

export const Route = createFileRoute('/guides/editable-data')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <Page
            category="Guides"
            title="Editable data"
            description="Not yet"
        >
            <ExampleBlock
                example={<EditableData />}
                code={code}
            />
        </Page >
    );
}
