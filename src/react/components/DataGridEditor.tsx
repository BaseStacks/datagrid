import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

interface DataGridEditorProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string;
    readonly overlay?: boolean;
    readonly minWidth?: number;
    readonly maxWidth?: number;
    readonly minHeight?: number;
    readonly maxHeight?: number;
}

function DataGridEditorImpl<TElement extends HTMLElement = HTMLElement>({ as, overlay, minWidth, maxWidth, minHeight, maxHeight, ...props }: DataGridEditorProps<TElement>) {
    const { layout, state, modifier } = useDataGridContext();
    const ref = useRef<TElement>(null);

    const Component = as || 'div' as React.ElementType;

    useLayoutEffect(() => {
        const unwatchContainerEditor = layout.layoutNodesState.watchItem('editorContainer', ({ item }) => {
            if (overlay) {
            }
            else {
                ref.current!.style.width = `${item.size.width}px`;
                ref.current!.style.height = `${item.size.height}px`;
            }
        });

        return () => {
            unwatchContainerEditor();
        };
    }, [layout, modifier, overlay, state.activeCell, state.editing]);

    useEffect(() => {
        if (overlay) {
            ref.current!.style.resize = 'both';
        }
        if (minWidth) {
            ref.current!.style.minWidth = `${minWidth}px`;
        }
        if (maxWidth) {
            ref.current!.style.maxWidth = `${maxWidth}px`;
        }
        if (minHeight) {
            ref.current!.style.minHeight = `${minHeight}px`;
        }
        if (maxHeight) {
            ref.current!.style.maxHeight = `${maxHeight}px`;
        }
    }, [maxHeight, maxWidth, minHeight, minWidth, overlay]);

    return (
        <Component {...props} ref={ref} />
    );
};

export const DataGridEditor = memo(DataGridEditorImpl) as typeof DataGridEditorImpl;
