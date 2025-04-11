
import { createFileRoute } from '@tanstack/react-router';
import { ExampleBlock } from '@/components/layout/ExampleBlock';
import { BasicExample } from '@/components/examples/BasicExample';
import { Page } from '@/components/layout/Page';
import code from '@/components/examples/BasicExample.tsx?raw';

export const Route = createFileRoute('/guides/basic')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <Page
            category="Guides"
            title="Basic Usage"
            description="This example demonstrates the basic usage of the `@basestacks/data-grid`. We create a simple table without any additional features."
        >
            <ExampleBlock
                example={<BasicExample />}
                code={code}
            />
        </Page >
    );
}
