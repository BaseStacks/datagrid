import { CellProps, useDataGridContext } from '@basestacks/data-grid';
import React from 'react';
import { useEffect, useRef } from 'react';

interface TextInputProps extends React.HTMLProps<HTMLInputElement> {
    readonly cell: CellProps<string>;
}

function TextInputImpl({ cell, ...props }: TextInputProps) {
    const { selection } = useDataGridContext();

    const { value, setValue, onFocus, onBlur } = cell;
    const ref = useRef<HTMLInputElement>(null);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        event.stopPropagation();

        if (event.key === 'Enter') {
            const nextValue = ref.current?.value || '';
            setValue(nextValue);
            selection.moveDown();
        }

        if (event.key === 'Escape') {
            ref.current!.value = value ?? '';
            selection.blur();
        }
    };

    useEffect(() => {
        const unsubscribeOnFocus = onFocus(() => {
            if (!ref.current) {
                return;
            }
            ref.current.focus();
            ref.current.select();
        });

        const unsubscribeOnBlur = onBlur(() => {
            if (!ref.current) {
                return;
            }
            ref.current.blur();
        });

        return () => {
            unsubscribeOnFocus();
            unsubscribeOnBlur();
        };
    }, [onBlur, onFocus]);

    useEffect(() => {
        if (ref.current) {
            ref.current.value = value ?? '';
        }
    }, [value]);

    return (
        <input
            {...props}
            ref={ref}
            defaultValue={value}
            className={clxs.input}
            onKeyDown={handleKeyDown}
        />
    );
}

const clxs = {
    input: 'w-full border-none bg-transparent p-0 text-gray-500 focus:outline-none focus:ring-0 dark:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
};

export const TextInput = React.memo(TextInputImpl);
