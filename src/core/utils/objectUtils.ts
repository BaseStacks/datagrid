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
