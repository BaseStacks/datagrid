const recursiveSet = (obj: any, path: string[], value: any): any => {
    const [key, ...rest] = path;

    if (rest.length === 0) {
        return { ...obj, [key]: value };
    }

    return {
        ...obj,
        [key]: recursiveSet(obj[key] || {}, rest, value),
    };
};

export const setAsClone = <T>(obj: T, path: string, value: any): T => {
    const keys = path.split('.');
    const newObj = recursiveSet(obj, keys, value);
    return newObj;
};

export const deepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;

    if (a == null || b == null) return false;

    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!deepEqual(a[key], b[key])) return false;
        }

        return true;
    }

    return false;
};
