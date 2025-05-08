import { CellEditorProps } from '@basestacks/data-grid';
import React, { } from 'react';
import { useRef } from 'react';

type SelectEditorProps = React.HTMLProps<HTMLSelectElement> & CellEditorProps & {
    readonly options: Array<{ value: string; label: string }>;
};

function SelectEditorImpl({ setValue, defaultValue, options, ...props }: SelectEditorProps) {
    const inputRef = useRef<HTMLSelectElement>(null);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextValue = event.target.value;
        setValue(nextValue);
    };

    return (
        <select
            {...props}
            key={props.id}
            ref={inputRef}
            defaultChecked={Boolean(defaultValue)}
            autoFocus={true}
            className={clxs.input}
            onChange={handleChange}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

const clxs = {
    input: 'w-full bg-transparent p-0 text-gray-500 focus:outline-none focus:ring-0 dark:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
};

export const SelectEditor = React.memo(SelectEditorImpl);
