import { Column, DataGridProvider, useDataGrid, useSelection, useStateWatch } from '@basestacks/data-grid';
import { useMemo, useState } from 'react';
import { TextInput } from './controls/TextInput';

export function EditableData() {
    const columns = useMemo((): Column[] => [
        { dataKey: 'id', header: 'ID' },
        { dataKey: 'firstName', header: 'First Name', cell: (cell) => <TextInput cell={cell} /> },
        { dataKey: 'lastName', header: 'Last Name', cell: (cell) => <TextInput cell={cell} /> },
        { dataKey: 'age', header: 'Age', cell: (cell) => <TextInput cell={cell} type="number" /> },
    ], []);

    const [data, setData] = useState([
        { id: 1, firstName: 'John', lastName: 'Doe', age: 30 },
        { id: 2, firstName: 'Jane', lastName: 'Smith', age: 25 },
        { id: 3, firstName: 'Alice', lastName: 'Johnson', age: 28 },
    ]);

    const dataGrid = useDataGrid({
        data,
        columns,
        onChange: setData // [!code highlight]
    });

    const headers = useStateWatch(dataGrid.state.headers);
    const rows = useStateWatch(dataGrid.state.rows);

    const selection = useSelection(dataGrid);

    return (
        <DataGridProvider dataGrid={dataGrid}>
            <div ref={selection.registerContainer} className="relative select-none">
                <table className={clxs.table}>
                    <thead>
                        <tr>
                            {headers.map((header, index) => (
                                <th key={index} className={clxs.header}>
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
                {/* [!code highlight:6] */}
                {selection.areaRect && (
                    <div className={clxs.selectionRect} style={selection.areaRect} />
                )}
                {selection.activeRect && (
                    <div className={clxs.selectionRect} style={selection.activeRect} />
                )}
            </div >
        </DataGridProvider >
    );
};

const clxs = {
    table: 'w-full table-auto border-collapse text-sm',
    header: 'border-b border-gray-200 p-4 pt-0 pb-3 pl-8 text-left font-medium text-gray-400 dark:border-gray-600 dark:text-gray-200',
    row: 'bg-white dark:bg-gray-800',
    cell: 'border-b border-gray-100 p-4 pl-8 text-gray-500 dark:border-gray-700 dark:text-gray-400',
    activeCell: 'outline outline-blue-500',
    selectionRect: 'absolute pointer-events-none outline-2 outline-offset-[-2px] outline-blue-600',
};
