
import { createFileRoute } from '@tanstack/react-router';
import { ExampleBlock } from '@/components/layout/ExampleBlock';
import { BasicExample } from '@/components/examples/BasicExample';
import code from '@/components/examples/BasicExample.tsx?raw';

export const Route = createFileRoute('/examples/basic')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <main>
            <p className="font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">
                Examples
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">
                Basic
            </h1>
            <p className="mt-6 text-base/7 text-gray-700 dark:text-gray-300">
                This example demonstrates the basic usage of the <code className="font-mono font-semibold text-gray-900 dark:text-white">@basestacks/data-grid</code>. We create a simple table without any additional features.
            </p>
            <div className="mt-8">
                <ExampleBlock
                    example={<BasicExample />}
                    code={code}
                />
            </div>
        </main>
    );
}
