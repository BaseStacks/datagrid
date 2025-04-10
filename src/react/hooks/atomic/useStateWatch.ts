import { useEffect, useState } from 'react';
import { DataGridState } from '../../../core';

export const useStateWatch = <TValue>(dataGridState: DataGridState<TValue>) => {
    const [value, setValue] = useState<TValue>(dataGridState.value);

    useEffect(() => {
        const unwatchData = dataGridState.watch((nextValue) => setValue(nextValue));

        return () => {
            unwatchData();
        };
    }, [dataGridState]);

    return value;
};
