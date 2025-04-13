import { CellProps } from '@basestacks/data-grid';
import React from 'react';
import { useEffect, useRef } from 'react';

interface TextInputProps extends React.HTMLProps<HTMLInputElement> {
    readonly cell: CellProps<string>;
}

function TextInputImpl({ cell, ...props }: TextInputProps) {
    const { value, setValue, onFocus, onBlur } = cell;
    const ref = useRef<HTMLInputElement>(null);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            ref.current?.blur();
            setValue(ref.current?.value || '');
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            ref.current!.value = value ?? '';
            ref.current!.blur();
        }
    };

    useEffect(() => {
        const unsubscribeOnFocus = onFocus(() => {
            ref.current?.focus();
            ref.current?.select();
        });

        const unsubscribeOnBlur = onBlur(() => {
            ref.current?.blur();
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
