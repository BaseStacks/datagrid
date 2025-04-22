import './styles.css';

import React, { HTMLAttributes, StrictMode, } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { MDXProvider } from '@mdx-js/react';

// Import the generated route tree
import { routeTree } from './routeTree.gen';
import { CodeBlock } from './components/layout/CodeBlock';
import { PageHeader } from './components/PageHeader';

// Create a new router instance
const router = createRouter({ routeTree } as any);

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

const mdxComponents = {
    PageHeader,
    pre: ({ children }: { children: React.ReactElement<HTMLAttributes<HTMLElement>> }) => {
        const codeNode = children.props.children as string;
        const language = children.props.className?.replace('language-', '');
        return <CodeBlock language={language!}>{codeNode as string}</CodeBlock>;
    }
};

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <MDXProvider components={mdxComponents}>
            <RouterProvider router={router} />
        </MDXProvider>
    );
}
