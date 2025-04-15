import { useEffect, useState } from 'react';
import type { DataGridState } from '../../../core';

export const useDataGridState = <TValue>(dataGridState: DataGridState<TValue>) => {
    const [value, setValue] = useState<TValue>(dataGridState.value);

    useEffect(() => {
        const unwatchData = dataGridState.watch((nextValue) => setValue(nextValue));

        return () => {
            unwatchData();
        };
    }, [dataGridState]);

    return value;
};
