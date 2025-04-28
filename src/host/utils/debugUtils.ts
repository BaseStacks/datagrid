export const arrayDiff = <T>(a: T[], b: T[]): T[] => {
    const diff = a.filter(item => !b.includes(item));
    return diff;
};
