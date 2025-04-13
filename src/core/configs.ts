import type { DataGridKeyMap } from './types';

export const defaultKeyMap: DataGridKeyMap = {
    // tabNext: 'Tab',
    // tabPrevious: 'Shift+Tab',
    activeLower: 'ArrowDown',
    activeUpper: 'ArrowUp',
    activeLeft: 'ArrowLeft',
    activeRight: 'ArrowRight',

    jumpBottom: '$mod+ArrowDown',
    jumpTop: '$mod+ArrowUp',
    jumpLeft: '$mod+ArrowLeft',
    jumpRight: '$mod+ArrowRight',

    expandRight: 'Shift+ArrowRight',
    expandLeft: 'Shift+ArrowLeft',
    expandUpper: 'Shift+ArrowDown',
    expandLower: 'Shift+ArrowUp',

    selectAll: '$mod+a',
    exit: 'Escape',
    focus: ['Enter', 'F2'],

    // insertRow: 'Shift+Enter',
    // duplicateRow: '$mod+d',
    // delete: ['Backspace', 'Delete'],
};
