export interface RectType {
    readonly width: number;
    readonly height: number;
    readonly left: number;
    readonly top: number;
}

export const getRect = (container: HTMLElement, start?: HTMLElement, end?: HTMLElement): RectType => {
    // Get bounding rectangles
    if (start && end) {
        const startRect = start.getBoundingClientRect();
        const endRect = end.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate the top-left and bottom-right corners
        const left = Math.min(startRect.left, endRect.left) - containerRect.left;
        const top = Math.min(startRect.top, endRect.top) - containerRect.top;
        const right = Math.max(startRect.right, endRect.right) - containerRect.left;
        const bottom = Math.max(startRect.bottom, endRect.bottom) - containerRect.top;

        // Calculate width and height
        const width = right - left;
        const height = bottom - top;

        return {
            left,
            top,
            width,
            height
        };
    }

    if (start) {
        const startRect = start.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        return {
            left: startRect.left - containerRect.left,
            top: startRect.top - containerRect.top,
            width: startRect.width,
            height: startRect.height
        };
    }

    const containerRect = container.getBoundingClientRect();
    const left = containerRect.left - containerRect.left;
    const top = containerRect.top - containerRect.top;
    const right = containerRect.right - containerRect.left;
    const bottom = containerRect.bottom - containerRect.top;
    const width = right - left;
    const height = bottom - top;
    return {
        left,
        top,
        width,
        height
    };
};

interface CursorOffset {
    x: number;
    y: number;
}

export const findRect = (offset: CursorOffset, rects: (RectType | null)[]): RectType | null => {
    for (const rect of rects) {
        if(!rect) continue; // Skip if rect is null or undefined

        if (
            offset.x >= rect.left &&
            offset.x <= rect.left + rect.width &&
            offset.y >= rect.top &&
            offset.y <= rect.top + rect.height
        ) {
            return rect;
        }
    }
    return null;
};

export const getCursorOffset = (event: MouseEvent, container: HTMLElement): CursorOffset => {
    const containerRect = container.getBoundingClientRect();
    return {
        x: event.clientX - containerRect.left,
        y: event.clientY - containerRect.top
    };
};
