import { useDataGrid } from '@basestacks/data-grid';
import { useMemo, useState } from 'react';

export function BasicExample() {
    const columns = useMemo(() => [
        { dataKey: 'id', header: 'ID' },
        { dataKey: 'name', header: 'Name' },
        { dataKey: 'age', header: 'Age' },
    ], []);

    const [data] = useState([
        { id: 1, name: 'John Doe', age: 30 },
        { id: 2, name: 'Jane Smith', age: 25 },
        { id: 3, name: 'Alice Johnson', age: 28 },
    ]);

    const dataGrid = useDataGrid({ data, columns });

    return (
        <table className={clxs.table}>
            <thead>
                <tr>
                    {dataGrid.headers.map((header, index) => (
                        <th key={index} className={clxs.header}>
                            {header.render()}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {dataGrid.rows.map((row, index) => (
                    <tr key={index} className={clxs.row}>
                        {row.cells.map((cell, cellIndex) => (
                            <td key={cellIndex} className={clxs.cell}>
                                {cell.render()}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const clxs = {
    table: 'w-full table-auto border-collapse text-sm',
    header: 'border-b border-gray-200 p-4 pt-0 pb-3 pl-8 text-left font-medium text-gray-400 dark:border-gray-600 dark:text-gray-200',
    row: 'bg-white dark:bg-gray-800',
    cell: 'border-b border-gray-100 p-4 pl-8 text-gray-500 dark:border-gray-700 dark:text-gray-400',
};
