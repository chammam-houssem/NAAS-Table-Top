import { useEffect, useState } from '../utils/mini-react.js';
import { store, StoreState } from './store.js';

export function useStore<T>(selector: (state: StoreState) => T): T {
  const [value, setValue] = useState(() => selector(store.getState()));
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setValue(selector(store.getState()));
    });
    return unsubscribe;
  }, []);
  return value;
}
