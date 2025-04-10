
import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { DataGridColumn, useDataGrid } from '@basestacks/data-grid';

export const Route = createFileRoute('/examples/this')({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <main>
            <p className="font-mono text-xs/6 font-medium tracking-widest text-gray-600 uppercase dark:text-gray-400">
                Examples
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight text-gray-950 dark:text-white">
                This example
            </h1>
            <p className="mt-6 text-base/7 text-gray-700 dark:text-gray-300">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            <div>
                <DataGridExample />
            </div>
        </main>
    );
}

function DataGridExample() {
    const [columns] = useState<DataGridColumn[]>([]);
    const [data, setData] = useState([]);

    const dataGrid = useDataGrid({
        data,
        columns,
        onChange: setData
    });

    console.log(dataGrid);
    
    return null;
};
