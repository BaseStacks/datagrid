import type { CellCoordinates, Id } from '../types';

export interface RectType {
    readonly width: number;
    readonly height: number;
    readonly left: number;
    readonly top: number;
}

export interface CursorOffset {
    x: number;
    y: number;
}

export const getRect = (container: HTMLElement, start?: HTMLElement, end?: HTMLElement): RectType => {
    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    // Get bounding rectangles
    if (start && end) {
        const startRect = start.getBoundingClientRect();
        const endRect = end.getBoundingClientRect();


        const left = Math.min(startRect.left, endRect.left) - containerRect.left + scrollLeft;
        const top = Math.min(startRect.top, endRect.top) - containerRect.top + scrollTop;
        const right = Math.max(startRect.right, endRect.right) - containerRect.left + scrollLeft;
        const bottom = Math.max(startRect.bottom, endRect.bottom) - containerRect.top + scrollTop;
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

        return {
            left: startRect.left - containerRect.left + scrollLeft,
            top: startRect.top - containerRect.top + scrollTop,
            width: startRect.width,
            height: startRect.height
        };
    }

    const left = containerRect.left - containerRect.left + scrollLeft;
    const top = containerRect.top - containerRect.top + scrollTop;
    const right = containerRect.right - containerRect.left + scrollLeft;
    const bottom = containerRect.bottom - containerRect.top + scrollTop;
    const width = right - left;
    const height = bottom - top;

    return {
        left,
        top,
        width,
        height
    };
};

export const findRect = (offset: CursorOffset, rects: (RectType | null)[]): RectType | null => {
    for (const rect of rects) {
        if (!rect) continue; // Skip if rect is null or undefined

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

export const mergeRects = (...rects: RectType[]): RectType => {
    if (rects.length === 0) {
        return {
            left: 0,
            top: 0,
            width: 0,
            height: 0
        };
    }

    const left = Math.min(...rects.map(rect => rect.left));
    const top = Math.min(...rects.map(rect => rect.top));
    const right = Math.max(...rects.map(rect => rect.left + rect.width));
    const bottom = Math.max(...rects.map(rect => rect.top + rect.height));

    return {
        left,
        top,
        width: right - left,
        height: bottom - top
    };
};

export const getCursorOffset = (event: MouseEvent, container: HTMLElement): CursorOffset => {
    const containerRect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    return {
        x: event.clientX - containerRect.left + scrollLeft,
        y: event.clientY - containerRect.top + scrollTop
    };
};


export const buildRectMap = (container: HTMLElement, coordElementMap: Map<CellCoordinates, HTMLElement | null>) => {
    const map = new Map<CellCoordinates, RectType | null>();
    coordElementMap.forEach((element, coord) => {
        if (element) {
            map.set(coord, getRect(container, element));
        } else {
            map.set(coord, null);
        }
    });
    return map;
};

export const findIdByRect = (cellRectMap: Map<Id, RectType | null>, rect: RectType): Id | null => {
    for (const [cellId, cellRect] of cellRectMap.entries()) {
        if (cellRect && cellRect.left === rect.left && cellRect.top === rect.top) {
            return cellId;
        }
    }

    return null;
};
