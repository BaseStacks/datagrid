import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/examples/that')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <main>
            <p className="font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">
                Examples
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">
                That example
            </h1>
            <p className="mt-6 text-base/7 text-gray-700 dark:text-gray-300">
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
        </main>
    );
}
