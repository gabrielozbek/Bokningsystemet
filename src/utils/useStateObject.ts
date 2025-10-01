import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

type StateSetter<T extends Record<string, unknown>> = <K extends keyof T>(
  key: K,
  value: T[K],
) => void;

type StateTuple<T extends Record<string, unknown>> = readonly [T, StateSetter<T>];

export function useStateObject<T extends Record<string, unknown>>(initialObject: T): StateTuple<T> {
  const [state, setState] = useState(initialObject);
  const setter: StateSetter<T> = (key, value) => {
    setState(previous => ({ ...previous, [key]: value }));
  };

  return [state, setter];
}

export function useStateContext<T extends Record<string, unknown>>() {
  return useOutletContext<StateTuple<T>>();
}
