import { memo, useEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';
import { setAttributes, type DataGridCellNode } from '../../dom';

interface DataGridFloatingEditorProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
}

function DataGridFloatingEditorImpl<TElement extends HTMLElement = HTMLElement>({ as, style, ...props }: DataGridFloatingEditorProps<TElement>) {
    const { layout, state, renderer } = useDataGridContext();

    const ref = useRef<TElement>(null);

    const activeCellRef = useRef<DataGridCellNode>(null);
    const [editor, setEditor] = React.useState(null);

    const Component = as || 'div' as React.ElementType;

    const composedStyle = useMemo(() => ({
        ...style,
        display: !editor && 'none',
        position: 'absolute'
    }), [editor, style]);

    useEffect(() => {
        const unwatchContainerEditor = layout.layoutNodesState.watchItem('editorContainer', ({ item }) => {
            ref.current!.style.left = item.offset.left === undefined ? '' : `${item.offset.left}px`;
            ref.current!.style.top = item.offset.top === undefined ? '' : `${item.offset.top}px`;
        });

        const unwatchEditorVisible = state.editing.watch((editing) => {
            if (editing !== 'floating') {
                setEditor(null);
                activeCellRef.current = null;
                return;
            }

            const newEditor = renderer.renderEditor();
            setEditor(newEditor);
            activeCellRef.current = layout.getNode(state.activeCell.value!.id) as DataGridCellNode;
        });

        return () => {
            unwatchContainerEditor();
            unwatchEditorVisible();
        };
    }, [layout, renderer, state.activeCell, state.editing]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const containerZIndex = getComputedStyle(ref.current!).zIndex;
        const hasZIndex = Number.isNaN(+containerZIndex) === false && containerZIndex !== 'auto';

        if (!hasZIndex) {
            const activeRow = layout.getNode(activeCellRef.current!.rowId);
            const rowZIndex = getComputedStyle(activeRow!.element).zIndex;
            const cellZIndex = getComputedStyle(activeCellRef.current!.element).zIndex;

            const zIndex = Math.max(Number(rowZIndex) || 0, Number(cellZIndex) || 0) + 1;
            ref.current!.style.zIndex = `${zIndex}`;

        }

        setAttributes(ref.current!, {
            'data-editing': true,
        });
    }, [editor, layout]);

    useEffect(() => {
        layout.registerNode('editorContainer', ref.current!);

        ref.current!.style.zIndex = '0';
        setAttributes(ref.current!, {
            'data-editing': false,
        });

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

export const DataGridFloatingEditor = memo(DataGridFloatingEditorImpl) as typeof DataGridFloatingEditorImpl;
