export const setAttributes = (element: HTMLElement, attributes: Record<string, string | number | boolean | undefined | null >) => {
    Object.entries(attributes).forEach(([key, value]) => {
        if (value === null || value === undefined || value === false) {
            element.removeAttribute(key);
        } else {
            element.setAttribute(key, String(value));
        }
    });
};
