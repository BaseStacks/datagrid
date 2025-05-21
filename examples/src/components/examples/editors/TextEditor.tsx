import { CellEditorProps, useDataGridContext } from '@basestacks/datagrid';
import React, { } from 'react';
import { useRef } from 'react';

type TextEditorProps = React.HTMLProps<HTMLInputElement> & CellEditorProps;

function TextEditorImpl({ setValue, defaultValue, ...props }: TextEditorProps) {
    const { selection } = useDataGridContext();

    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation();

        if (event.key === 'Enter') {
            const nextValue = inputRef.current?.value || '';
            setValue(nextValue);
            selection.moveDown();
        }

        if (event.key === 'Escape') {
            inputRef.current!.value = defaultValue ?? '';
            selection.blur();
        }
    };

    return (
        <input
            {...props}
            key={props.id}
            ref={inputRef}
            defaultValue={defaultValue}
            autoFocus={true}
            className={clxs.input}
            onKeyDown={handleKeyDown}
        />
    );
}

const clxs = {
    input: 'w-full h-full border-none bg-transparent p-0 text-gray-500 focus:outline-none focus:ring-0 dark:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
};

export const TextEditor = React.memo(TextEditorImpl);
