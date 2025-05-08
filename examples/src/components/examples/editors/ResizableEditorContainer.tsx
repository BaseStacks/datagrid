import { memo, useEffect, useRef } from 'react';
import React from 'react';

interface ResizableEditorContainerProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string;
    readonly minWidth?: number;
    readonly maxWidth?: number;
    readonly minHeight?: number;
    readonly maxHeight?: number;
}

function ResizableEditorContainerImpl<TElement extends HTMLElement = HTMLElement>({ as, minWidth, maxWidth, minHeight, maxHeight, ...props }: ResizableEditorContainerProps<TElement>) {
    const ref = useRef<TElement>(null);

    const Component = as || 'div' as React.ElementType;


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

export const ResizableEditorContainer = memo(ResizableEditorContainerImpl) as typeof ResizableEditorContainerImpl;
