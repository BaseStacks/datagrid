
import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDefinition, useDataGrid } from '@basestacks/data-grid';

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
    const [columns] = useState<ColumnDefinition[]>([
        { dataKey: 'id', header: 'ID' },
        { dataKey: 'name', header: 'Name' },
        { dataKey: 'age', header: 'Age' },
    ]);
    const [data, setData] = useState([
        { id: 1, name: 'John Doe', age: 30 },
        { id: 2, name: 'Jane Smith', age: 25 },
        { id: 3, name: 'Alice Johnson', age: 28 },
    ]);

    const dataGrid = useDataGrid({
        data,
        columns,
        onChange: setData
    });

    return (
        <div>
            <div>
                {dataGrid.state?.getHeaders().map((header, index) => (
                    <div key={index} className="p-2 border-b">
                        {header.render()}
                    </div>
                ))}
            </div>
            <div>
                {dataGrid.state?.getRows().map((row, index) => (
                    <div key={index} className="p-2 border-b">
                        {row.cells.map((cell, cellIndex) => (
                            <div key={cellIndex} className="p-2">
                                {cell.render()}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div>
                {dataGrid.state?.getFooters().map((footer, index) => (
                    <div key={index} className="p-2 border-b">
                        {footer.render()}
                    </div>
                ))}
            </div>
        </div>
    );
};
