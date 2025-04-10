import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
    component: Index,
});

function Index() {
    return (
        <main>
            <p className="font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">
                Getting Started
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">Introduction</h1>
            <p className="mt-6 text-base/7 text-gray-700 dark:text-gray-300">
                This is a template for creating a node package. It includes a set of tools and configurations to help you get started quickly and easily.
            </p>
        </main>
    );
}
