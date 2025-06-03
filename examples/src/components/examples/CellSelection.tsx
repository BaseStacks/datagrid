import { Column, DataGridProvider, useDataGrid, useDataGridState, DataGridContainer, DataGridCell, CellSelectionPlugin, DataGridHeader, DataGridHeaderGroup, DataGridRow, DataGridScrollArea, StayInViewPlugin, RowPinningPlugin, RowKey, DataGridRowContainer, ColumnPinningPlugin, usePlugin, LayoutPlugin, CellEditablePlugin, DataGridCellContent, DataGridFloatingEditor, CopyPastePlugin, CellFillPlugin, DataGridFillHandle, DataGridFillRange, HistoryPlugin } from '@basestacks/datagrid';
import { useMemo, useState } from 'react';
import { generateData } from '@/helpers/dataHelpers';
import { cn } from '@/utils/cn';
import { TextEditor } from './editors/TextEditor';
import { CheckboxEditor } from './editors/CheckboxEditor';
import { TextAreaEditor } from './editors/TextAreaEditor';
import { SelectEditor } from './editors/SelectEditor';

const genderOptions = [{
    value: 'male',
    label: 'Male',
}, {
    value: 'female',
    label: 'Female',
}, {
    value: 'other',
    label: 'Other',
}];

export function CellSelection() {
    const columns = useMemo((): Column[] => [
        { key: 'column-header', dataKey: 'id', header: '#' },
        { key: 'id', header: 'ID', width: 100, selectable: false },
        { key: 'firstName', header: 'First Name', editor: (props) => <TextEditor {...props} /> },
        { key: 'lastName', header: 'Last Name', editor: (props) => <TextEditor {...props} /> },
        { key: 'gender', header: 'Gender', editor: (props) => <SelectEditor {...props} options={genderOptions} /> },
        { key: 'age', header: 'Age', editor: (props) => <TextEditor {...props} type="number" min={1} /> },
        { key: 'address', header: 'Address', editor: { float: true, render: (props) => <TextAreaEditor {...props} /> } },
        { key: 'email', header: 'Email', editor: (props) => <TextEditor {...props} type="email" /> },
        { key: 'phone', header: 'Phone', editor: (props) => <TextEditor {...props} /> },
        { key: 'verified', header: 'Verified', cell: (props) => <CheckboxEditor {...props} /> },
        { key: 'actions', header: 'Actions' },
    ], []);

    const [data, setData] = useState(() => {
        return generateData({
            fields: [
                { name: 'id', type: 'uuid', required: true },
                { name: 'firstName', type: 'firstName', required: true },
                { name: 'lastName', type: 'lastName', required: true },
                { name: 'gender', type: 'gender', required: false },
                { name: 'age', type: 'number', min: 18, max: 99, required: false },
                { name: 'address', type: 'address', required: false },
                { name: 'email', type: 'email', required: false },
                { name: 'verified', type: 'boolean', required: false },
                { name: 'phone', type: 'phone', required: false },
            ],
            count: 10
        });
    });

    const [pinnedLeftColumns] = useState<RowKey[]>(() => columns.slice(0, 2).map((col) => col.key as RowKey));
    const [pinnedRightColumns] = useState<RowKey[]>(() => columns.slice(-2).map((col) => col.key as RowKey));

    const [pinnedTopRows] = useState<RowKey[]>(() => data.slice(0, 2).map((row) => row.id as RowKey));
    const [pinnedBottomRows] = useState<RowKey[]>(() => data.slice(-2).map((row) => row.id as RowKey));

    const dataGrid = useDataGrid({
        data,
        columns,
        rowKey: 'id',
        onChange: setData
    });

    usePlugin(dataGrid, LayoutPlugin);
    usePlugin(dataGrid, CellSelectionPlugin);
    usePlugin(dataGrid, CellFillPlugin);
    usePlugin(dataGrid, StayInViewPlugin);
    usePlugin(dataGrid, CellEditablePlugin);
    usePlugin(dataGrid, ColumnPinningPlugin, {
        pinnedLeftColumns,
        pinnedRightColumns
    });
    usePlugin(dataGrid, RowPinningPlugin, {
        pinnedTopRows,
        pinnedBottomRows
    });
    usePlugin(dataGrid, CopyPastePlugin);
    usePlugin(dataGrid, HistoryPlugin);

    const headers = useDataGridState(dataGrid.state.headers);
    const rows = useDataGridState(dataGrid.state.rows);

    return (
        <DataGridProvider dataGrid={dataGrid}>
            <DataGridContainer className={clxs.table}>
                <DataGridHeaderGroup className={clxs.headerGroup}>
                    {headers.map((header, index) => (
                        <DataGridHeader key={index} header={header} className={cn(clxs.header, clxs.cellPinned)} />
                    ))}
                    <span className="absolute right-0 w-[-15px] h-full bg-white dark:bg-gray-950" />
                </DataGridHeaderGroup>
                <DataGridScrollArea className="h-[300px] overflow-auto">
                    <DataGridRowContainer className="relative">
                        {rows.map((row) => (
                            <DataGridRow key={row.id} row={row} className={cn(clxs.row, clxs.rowPinned)}>
                                {row.cells.map((cell) => (
                                    <DataGridCell key={cell.id} cell={cell} className={cn(clxs.cell, clxs.cellActive, clxs.cellSelected, clxs.cellPinned, clxs.cellEditing)}>
                                        <DataGridCellContent cell={cell} className="overflow-hidden line-clamp-1 break-words w-full first-letter:uppercase" />
                                    </DataGridCell>
                                ))}
                            </DataGridRow>
                        ))}
                    </DataGridRowContainer>
                    <DataGridFillHandle className="size-2 bg-blue-500 z-99 cursor-cell" />
                    <DataGridFillRange className="border border-dashed z-99 " />
                    <DataGridFloatingEditor className="!z-99" />
                </DataGridScrollArea>
            </DataGridContainer>
        </DataGridProvider>
    );
};

const clxs = {
    table: 'text-sm max-h-[400px]',
    headerGroup: 'bg-white dark:bg-gray-950 ',
    header: 'bg-white dark:bg-gray-950 flex items-center border border-transparent p-2 text-left font-medium text-gray-400 dark:text-gray-200',
    row: 'overflow-hidden border-gray-200 dark:border-gray-600',
    rowPinned: `
        data-pinned:z-20
        data-pinned-top-last:border-b
        data-pinned-bottom-first:border-t
    `,
    cell: 'user-select-none bg-white flex items-center border border-transparent p-2 text-gray-500 outline-blue-600 dark:text-gray-400 dark:bg-gray-800',
    cellActive: `
        data-active:bg-white 
        data-active:outline 
        data-active:outline-offset-[-1px]
        data-active:bg-gray-800
        dark:data-active:bg-gray-800
    `,
    cellSelected: `
        data-selected:bg-blue-950
        data-[edge-top=true]:border-t-blue-600
        data-[edge-left=true]:border-l-blue-600 
        data-[edge-right=true]:border-r-blue-600 
        data-[edge-bottom=true]:border-b-blue-600
    `,
    cellPinned: `
        data-pinned:z-10
        data-pinned-left-last:border-r-gray-600 
        data-pinned-right-first:border-l-gray-600
        dark:data-pinned-left-last:border-r-gray-600
        dark:data-pinned-right-first:border-l-gray-600
    `,
    cellEditing: `
        data-[editing="inline"]:outline-2
        data-[editing="inline"]:outline-offset-[-2px]
        data-[editing="floating"]:outline-none
        data-[editing="floating"]:border-transparent
    `,
    selectedRangeRect: 'absolute pointer-events-none outline-2 outline-offset-[-2px] outline-blue-600 bg-blue-600/5',
    editor: '',
};
