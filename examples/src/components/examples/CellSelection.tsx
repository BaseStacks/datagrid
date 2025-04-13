import { useDataGrid, useSelection, useStateWatch } from '@basestacks/data-grid';
import { useMemo, useState } from 'react';

export function CellSelection() {
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

    const selection = useSelection(dataGrid); // [!code highlight]

    const headers = useStateWatch(dataGrid.state.headers);
    const rows = useStateWatch(dataGrid.state.rows);

    return (
        <div ref={selection.registerContainer} className="relative select-none">
            <table className={clxs.table}>
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                className={clxs.header}
                            >
                                {header.render()}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index} className={clxs.row}>
                            {row.cells.map((cell) => (
                                <td
                                    key={cell.id}
                                    className={clxs.cell}
                                    ref={selection.registerCell(cell)}
                                >
                                    {cell.render()}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* [!code highlight:12] */}
            {selection.areaRect && (
                <div
                    className="absolute outline-2 outline-blue-600"
                    style={selection.areaRect}
                />
            )}
            {selection.activeRect && (
                <div
                    className="absolute outline outline-blue-600"
                    style={selection.activeRect}
                />
            )}
        </div>
    );
};

const clxs = {
    table: 'w-full table-auto border-collapse text-sm',
    header: 'border-b border-gray-200 p-4 pt-0 pb-3 pl-8 text-left font-medium text-gray-400 dark:border-gray-600 dark:text-gray-200',
    row: 'bg-white dark:bg-gray-800',
    cell: 'border-b border-gray-100 p-4 pl-8 text-gray-500 dark:border-gray-700 dark:text-gray-400',
    activeCell: 'outline outline-blue-500',
};
