import { CellEditorProps, useDataGridContext } from '@basestacks/data-grid';
import React, { } from 'react';
import { useRef } from 'react';
import { ResizableEditorContainer } from './ResizableEditorContainer';

type TextAreaEditorProps = React.HTMLProps<HTMLTextAreaElement> & CellEditorProps;

function TextAreaEditorImpl({ setValue, defaultValue, ...props }: TextAreaEditorProps) {
    const { selection } = useDataGridContext();

    const ref = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        event.stopPropagation();

        if (event.key === 'Enter' && !event.shiftKey) {
            const nextValue = ref.current?.value || '';
            setValue(nextValue);
            selection.moveDown();
        }

        if (event.key === 'Escape') {
            ref.current!.value = defaultValue ?? '';
            selection.blur();
        }
    };

    return (
        <ResizableEditorContainer
            className={clxs.container}
            minWidth={200}
            maxWidth={500}
            minHeight={42}
            maxHeight={200}
        >
            <textarea
                {...props}
                key={props.id}
                ref={ref}
                defaultValue={defaultValue}
                autoFocus={true}
                className={clxs.input}
                onKeyDown={handleKeyDown}
            />
        </ResizableEditorContainer>
    );
}

const clxs = {
    container: 'p-2 overflow-hidden outline-2 outline-offset-[-1px] outline-blue-600 bg-gray-800 dark:bg-gray-800 dark:outline-blue-600 dark:outline-offset-[-1px]',
    input: 'w-full h-full resize-none bg-transparent p-0 text-gray-500 focus:outline-none focus:ring-0 dark:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
};

export const TextAreaEditor = React.memo(TextAreaEditorImpl);
