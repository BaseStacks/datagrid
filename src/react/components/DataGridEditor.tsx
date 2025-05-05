import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { CellId } from '../../host';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';

interface DataGridEditorProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
}

function DataGridEditorImpl<TElement extends HTMLElement = HTMLElement>({ as, style, ...props }: DataGridEditorProps<TElement>) {
    const { layout, state, modifier } = useDataGridContext();
    const ref = useRef<TElement>(null);
    const activeCellRef = useRef<CellId>(null);

    const [editor, setEditor] = React.useState(null);

    const Component = as || 'div' as React.ElementType;

    const composedStyle = useMemo(() => ({
        ...style,
        display: editor ? 'block' : 'none',
        position: 'absolute',
    }), [editor, style]);

    useLayoutEffect(() => {
        const unwatchContainerEditor = layout.layoutNodesState.watchItem('editorContainer', ({ item }) => {
            ref.current!.style.width = `${item.size.width}px`;
            ref.current!.style.height = `${item.size.height}px`;
            ref.current!.style.left = item.offset.left === undefined ? '' : `${item.offset.left}px`;
            ref.current!.style.top = item.offset.top === undefined ? '' : `${item.offset.top}px`;
        });

        const unwatchActiveCell = state.activeCell.watch((activeCell) => {
            activeCellRef.current = activeCell?.id || null;
        });

        const unwatchEditing = state.editing.watch((editing) => {
            if (!editing) {
                setEditor(null);
                return;
            }
            const editor = modifier.renderEditor();
            setEditor(editor);
        });

        return () => {
            unwatchContainerEditor();
            unwatchActiveCell();
            unwatchEditing();
        };
    }, [layout.layoutNodesState, modifier, state.activeCell, state.editing]);

    useEffect(() => {
        layout.registerNode('editorContainer', ref.current!);
        return () => {
            layout.removeNode('editorContainer');
        };
    }, [layout]);

    return (
        <Component {...props} ref={ref} style={composedStyle}>
            {editor}
        </Component>
    );
};

export const DataGridEditor = memo(DataGridEditorImpl) as typeof DataGridEditorImpl;
