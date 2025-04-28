import { getRect } from './domRectUtils';

interface ViewportBounds {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
}

export function calculateScrollOffsets(target: HTMLElement, container: HTMLElement, viewport?: ViewportBounds) {
    const targetRect = getRect(container, target);

    const activeRectRight = targetRect.left + targetRect.width;
    const activeRectBottom = targetRect.top + targetRect.height;

    let nextScrollLeft: undefined | number;
    let nextScrollTop: undefined | number;

    if(!viewport) {
        const containerRect = container.getBoundingClientRect();
        viewport = {
            left: containerRect.left,
            top: containerRect.top,
            right: containerRect.right,
            bottom: containerRect.bottom,
        };
    }

    const needScrollVertical = targetRect.top < viewport.top || activeRectBottom > viewport.bottom;

    if (needScrollVertical) {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const scrollableHeight = scrollHeight - clientHeight;
        const scrollTopDelta = targetRect.top - viewport.top;

        const isTopIntersecting = targetRect.top < viewport.top;
        const needScrollTop = isTopIntersecting && scrollTopDelta < 0;
        if (needScrollTop) {
            const newScrollTop = scrollTop + scrollTopDelta;
            nextScrollTop = Math.max(0, Math.min(newScrollTop, scrollableHeight));
        }

        const scrollBottomDelta = activeRectBottom - viewport.bottom;
        const isBottomIntersecting = activeRectBottom > viewport.bottom;
        const needScrollBottom = isBottomIntersecting && scrollBottomDelta > 0;
        if (needScrollBottom) {
            const newScrollTop = scrollTop + scrollBottomDelta;
            nextScrollTop = Math.max(0, Math.min(newScrollTop, scrollableHeight));
        }
    }

    const needScrollHorizontal = targetRect.left < viewport.left || activeRectRight > viewport.right;
    if (needScrollHorizontal) {

        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const scrollableWidth = scrollWidth - clientWidth;
        const scrollLeftDelta = targetRect.left - viewport.left;

        const isLeftIntersecting = targetRect.left < viewport.left;
        const needScrollLeft = isLeftIntersecting && scrollLeftDelta < 0;
        if (needScrollLeft) {
            const newScrollLeft = scrollLeft + scrollLeftDelta;
            nextScrollLeft = Math.max(0, Math.min(newScrollLeft, scrollableWidth));
        }

        const scrollRightDelta = activeRectRight - viewport.right;
        const isRightIntersecting = activeRectRight > viewport.right;
        const needScrollRight = isRightIntersecting && scrollRightDelta > 0;
        if (needScrollRight) {
            const newScrollLeft = scrollLeft + scrollRightDelta;
            nextScrollLeft = Math.max(0, Math.min(newScrollLeft, scrollableWidth));
        }
    }
    return {
        left: nextScrollLeft,
        top: nextScrollTop,
    };
}

