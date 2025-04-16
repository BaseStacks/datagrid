import { useRef, useState } from 'react';
import { deepEqual } from '../../../core';

export const useStrictState = <TValue>(
    initValue: TValue | (() => TValue),
    options: { useDeepEqual?: boolean } = {}
) => {
    const { useDeepEqual } = options;
    const [state, setState] = useState(() => {
        if (typeof initValue === 'function') {
            return (initValue as () => TValue)();
        }
        return initValue;
    });

    const strictSetState = useRef((value: TValue) => {
        if (useDeepEqual) {
            if (deepEqual(state, value)) {
                return;
            }
        }
        if (!useDeepEqual && state !== value) {
            setState(value);

        }
    });

    return [state, strictSetState.current] as const;
};
