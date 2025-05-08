import { CellEditorProps } from '@basestacks/data-grid';
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
    );
}

const clxs = {
    input: 'bg-transparent p-0 text-gray-500 focus:outline-none focus:ring-0 dark:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
};

export const CheckboxEditor = React.memo(CheckboxEditorImpl);
