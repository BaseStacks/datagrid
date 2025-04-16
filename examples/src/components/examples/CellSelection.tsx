import { Column, DataGridProvider, useDataGrid, useDataGridState, DataGridContainer, DataGridCell, CellSelectionPlugin, usePlugin, SelectedRangeRects, ActiveCellRect, SelectionBackdrop, DataGridHeader, DataGridHeaderGroup, DataGridRow } from '@basestacks/data-grid';
import { useMemo, useState } from 'react';
import { TextInput } from './controls/TextInput';
import { generateData } from '@/helpers/dataHelpers';

export function CellSelection() {
    const columns = useMemo((): Column[] => [
        { dataKey: 'id', header: 'ID' },
        { dataKey: 'firstName', header: 'First Name', cell: (cell) => <TextInput cell={cell} /> },
        { dataKey: 'lastName', header: 'Last Name', cell: (cell) => <TextInput cell={cell} /> },
        { dataKey: 'age', header: 'Age', cell: (cell) => <TextInput cell={cell} /> },
        { dataKey: 'email', header: 'Email', cell: (cell) => <TextInput cell={cell} /> },
    ], []);

    const [data, setData] = useState(() => {
        return generateData({
            fields: [
                { name: 'id', type: 'number', required: true },
                { name: 'firstName', type: 'firstName', required: true },
                { name: 'lastName', type: 'lastName', required: true },
                { name: 'age', type: 'number', min: 18, max: 99, required: false },
                { name: 'email', type: 'email', required: false },
            ],
            count: 10
        });
    });

    const dataGrid = useDataGrid({
        data,
        columns,
        onChange: setData
    });

    const headers = useDataGridState(dataGrid.state.headers);
    const rows = useDataGridState(dataGrid.state.rows);

    const cellSelection = usePlugin(dataGrid, CellSelectionPlugin, {});

    return (
        <DataGridProvider dataGrid={dataGrid}>
            <DataGridContainer>
                <div className={clxs.table}>
                    <DataGridHeaderGroup>
                        {headers.map((header, index) => (
                            <DataGridHeader key={index} header={header} className={clxs.header} />
                        ))}
                    </DataGridHeaderGroup>
                    {rows.map((row, index) => (
                        <DataGridRow key={index} className={clxs.row}>
                            {row.cells.map((cell) => (
                                <DataGridCell key={cell.id} cell={cell} className={clxs.cell}>
                                    {cell.render()}
                                </DataGridCell>
                            ))}
                        </DataGridRow>
                    ))}
                </div>
                <SelectedRangeRects selection={cellSelection} className={clxs.selectedRangeRect} />
                <ActiveCellRect selection={cellSelection} className={clxs.activeRect} />
                <SelectionBackdrop selection={cellSelection} />
            </DataGridContainer>
        </DataGridProvider>
    );
};

const clxs = {
    table: 'border-collapse text-sm',
    header: 'border-b border-gray-200 p-4 text-left font-medium text-gray-400 flex items-center dark:border-gray-600 dark:text-gray-200',
    row: 'bg-white dark:bg-gray-800',
    cell: 'border-b border-gray-100 p-4 text-gray-500 dark:border-gray-700 dark:text-gray-400',
    activeCell: 'outline outline-blue-500',
    selectedRangeRect: 'absolute pointer-events-none outline-2 outline-offset-[-2px] outline-blue-600 bg-blue-600/5',
    activeRect: 'absolute pointer-events-none outline outline-yellow-600',
};
