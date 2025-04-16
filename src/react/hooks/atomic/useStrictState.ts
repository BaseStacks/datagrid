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
    const stateRef = useRef(state);
    const strictSetState = useRef((newValue: TValue) => {
        if (useDeepEqual && deepEqual(stateRef.current, newValue)) {
            return;
        }
        else if (!useDeepEqual && stateRef.current === newValue) {
            return;
        }

        setState(newValue);
        stateRef.current = newValue;
    });

    return [state, strictSetState.current] as const;
};
