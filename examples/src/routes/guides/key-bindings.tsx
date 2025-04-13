import { ExampleBlock } from '@/components/layout/ExampleBlock';
import { createFileRoute } from '@tanstack/react-router';
import { KeyBindings } from '@/components/examples/KeyBindings';
import { Page } from '@/components/layout/Page';

import code from '@/components/examples/KeyBindings.tsx?raw';

export const Route = createFileRoute('/guides/key-bindings')({
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
                example={<KeyBindings />}
                code={code}
            />
        </Page >
    );
}
