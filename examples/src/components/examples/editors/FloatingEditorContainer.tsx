import { useDataGridContext } from '@basestacks/data-grid';
import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import React from 'react';

interface FloatingEditorContainerProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string;
    readonly minWidth?: number;
    readonly maxWidth?: number;
    readonly minHeight?: number;
    readonly maxHeight?: number;
}

function FloatingEditorContainerImpl<TElement extends HTMLElement = HTMLElement>({ as, minWidth, maxWidth, minHeight, maxHeight, ...props }: FloatingEditorContainerProps<TElement>) {
    const { layout } = useDataGridContext();
    const ref = useRef<TElement>(null);

    const Component = as || 'div' as React.ElementType;

    useLayoutEffect(() => {
        const unwatchContainerEditor = layout.layoutNodesState.watchItem('editorContainer', ({ item }) => {
            ref.current!.style.width = `${item.size.width}px`;
            ref.current!.style.height = `${item.size.height}px`;
        });

        return () => {
            unwatchContainerEditor();
        };
    }, [layout.layoutNodesState]);

    useEffect(() => {
        ref.current!.style.resize = 'both';

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
    }, [maxHeight, maxWidth, minHeight, minWidth]);

    return <Component {...props} ref={ref} />;
};

export const FloatingEditorContainer = memo(FloatingEditorContainerImpl) as typeof FloatingEditorContainerImpl;
