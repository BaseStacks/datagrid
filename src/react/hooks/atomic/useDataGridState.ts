import { useEffect } from 'react';
import type { DataGridState } from '../../../core';
import { useStrictState } from './useStrictState';

interface UseDataGridStateOptions<TValue, TCollect = TValue> {
    readonly collect?: (value: TValue) => TCollect;
}

export const useDataGridState = <TValue, TCollect = TValue>(
    dataGridState: DataGridState<TValue>,
    options: UseDataGridStateOptions<TValue, TCollect> = {}
) => {
    const { collect } = options;

    const [value, setValue] = useStrictState(() => {
        const initialValue = dataGridState.value;
        return collect ? collect(initialValue) : initialValue;
    });

    useEffect(() => {
        const unwatchData = dataGridState.watch((nextValue) => {
            const collectValue = collect ? collect(nextValue) : nextValue;
            setValue(collectValue);
        });

        return () => {
            unwatchData();
        };
    }, [collect, dataGridState, setValue]);

    return value as TCollect;
};
