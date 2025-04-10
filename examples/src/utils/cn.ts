import { twMerge } from 'tailwind-merge';

export const cn = (...args: any[]) => {
    return twMerge(args.join(' '));
};
