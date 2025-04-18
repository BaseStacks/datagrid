import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/primitive/Tabs';
import { CodeBlock } from '../../components/layout/CodeBlock';

export const Route = createFileRoute('/getting-started/installation')({
    component: RouteComponent,
});

function RouteComponent() {
    const [defaultTab] = useState(() => {
        const hash = window.location.hash;
        if (hash) {
            return hash.substring(1);
        }
        return 'npm';
    });

    return (
        <main>
            <p className="font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">
                Getting Started
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">Installation</h1>
            <p className="mt-6 text-base/7 text-gray-700 dark:text-gray-300">
                This page describes how to install the package. You can install it using npm, yarn, or pnpm. To install the package, run the following command in your terminal:
            </p>
            <h2 data-docsearch-ignore="true" className="mb-6 text-lg font-semibold tracking-tight text-gray-950 dark:text-white">Installation</h2>
            <div className="-mx-4 mb-6 flex overflow-auto sm:-mx-6">
                <Tabs defaultValue={defaultTab} className="min-w-full flex-none px-4 sm:px-6">
                    <TabsList>
                        <TabsTrigger value="npm" asChild>
                            <a href="#npm" className="no-underline">npm</a>
                        </TabsTrigger>
                        <TabsTrigger value="yarn" >
                            <a href="#yarn" className="no-underline">yarn</a>
                        </TabsTrigger>
                        <TabsTrigger value="pnpm" className="decoration-0">
                            <a href="#pnpm" className="no-underline">pnpm</a>
                        </TabsTrigger>
                        <TabsTrigger value="bun" className="decoration-0">
                            <a href="#bun" className="no-underline">bun</a>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="npm">
                        <CodeBlock language="bash" header="terminal">
                            npm install your-package-name
                        </CodeBlock>
                    </TabsContent>
                    <TabsContent value="yarn">
                        <CodeBlock language="bash" header="terminal">
                            yarn add your-package-name
                        </CodeBlock>
                    </TabsContent>
                    <TabsContent value="pnpm">
                        <CodeBlock language="bash" header="terminal">
                            pnpm add your-package-name
                        </CodeBlock>
                    </TabsContent>
                    <TabsContent value="bun">
                        <CodeBlock language="bash" header="terminal">
                            bun add your-package-name
                        </CodeBlock>
                    </TabsContent>
                </Tabs>
            </div>
            <h2 data-docsearch-ignore="true" className="mb-6 text-lg font-semibold tracking-tight text-gray-950 dark:text-white">Usage</h2>
            <p className="text-base/7 text-gray-700 dark:text-gray-300">
                After installing the package, you can import it in your JavaScript or TypeScript files:
            </p>
            <CodeBlock language="tsx">
                {'import { YourComponent } from \'your-package-name\';'}
            </CodeBlock>
        </main>
    );
}
