import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDataGridContext } from '../hooks/useDataGridContext';
import React from 'react';
import { setAttributes, type DataGridCellNode } from '../../dom';

interface DataGridEditorProps<TElement extends HTMLElement> extends React.HTMLAttributes<TElement> {
    readonly as?: string
}

function DataGridEditorImpl<TElement extends HTMLElement = HTMLElement>({ as, style, ...props }: DataGridEditorProps<TElement>) {
    const { layout, state, modifier } = useDataGridContext();
    const ref = useRef<TElement>(null);
    const activeCellRef = useRef<DataGridCellNode>(null);

    const [editor, setEditor] = React.useState(null);

    const Component = as || 'div' as React.ElementType;

    const composedStyle = useMemo(() => ({
        ...style,
        display: !editor && 'none',
        position: 'absolute'
    }), [editor, style]);

    useLayoutEffect(() => {
        const unwatchContainerEditor = layout.layoutNodesState.watchItem('editorContainer', ({ item }) => {
            ref.current!.style.minWidth = `${item.size.width}px`;
            ref.current!.style.minHeight = `${item.size.height}px`;
            ref.current!.style.left = item.offset.left === undefined ? '' : `${item.offset.left}px`;
            ref.current!.style.top = item.offset.top === undefined ? '' : `${item.offset.top}px`;
        });

        const unwatchActiveCell = state.activeCell.watch((activeCell) => {
            if (!activeCell) {
                activeCellRef.current = null;
                return;
            }

            const activeCellNode = layout.getNode(activeCell!.id) as DataGridCellNode;
            activeCellRef.current = activeCellNode;
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
    }, [layout, modifier, state.activeCell, state.editing]);

    useEffect(() => {
        if (editor) {
            const activeRow = layout.getNode(activeCellRef.current!.rowId);
            const rowZIndex = getComputedStyle(activeRow!.element).zIndex;
            const cellZIndex = getComputedStyle(activeCellRef.current!.element).zIndex;

            const zIndex = Math.max(Number(rowZIndex) || 0, Number(cellZIndex) || 0) + 1;
            ref.current!.style.zIndex = `${zIndex}`;

            setAttributes(ref.current!, {
                'data-editing': true,
            });
        }
        else {
            ref.current!.style.zIndex = '0';

            setAttributes(ref.current!, {
                'data-editing': false,
            });
        }
    }, [editor, layout]);

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
