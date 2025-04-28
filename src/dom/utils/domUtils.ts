export const clearAllTextSelection = () => {
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
        selection.removeAllRanges();
    }
};
