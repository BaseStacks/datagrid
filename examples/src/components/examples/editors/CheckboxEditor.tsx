import { CellEditorProps, DataGridEditor, useDataGridContext } from '@basestacks/data-grid';
import React, { } from 'react';
import { useRef } from 'react';

type CheckboxEditorProps = React.HTMLProps<HTMLInputElement> & CellEditorProps;

function CheckboxEditorImpl({ setValue, defaultValue, ...props }: CheckboxEditorProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.checked;
        setValue(nextValue);
    };

    return (
        <DataGridEditor className={clxs.container}>
            <input
                {...props}
                type="checkbox"
                key={props.id}
                ref={inputRef}
                defaultChecked={Boolean(defaultValue)}
                autoFocus={true}
                className={clxs.input}
                onChange={handleChange}
            />
        </DataGridEditor>
    );
}

const clxs = {
    container: 'bg-black p-2 flex items-center overflow-hidden outline-2 outline-offset-[-1px] outline-blue-600 bg-gray-800 dark:bg-gray-800 dark:outline-blue-600 dark:outline-offset-[-1px]',
    input: 'bg-transparent p-0 text-gray-500 focus:outline-none focus:ring-0 dark:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
};

export const CheckboxEditor = React.memo(CheckboxEditorImpl);
