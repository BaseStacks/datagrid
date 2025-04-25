export const setAttributes = (element: HTMLElement, attributes: Record<string, string | number | boolean>) => {
    Object.entries(attributes).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            element.removeAttribute(key);
        } else {
            element.setAttribute(key, String(value));
        }
    });
};
