import { useSyncExternalStore } from "react";

export type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
) => void;

export type GetState<T> = () => T;

export type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

export type StoreApi<T> = {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
};

export function create<T extends object>(initializer: StateCreator<T>): StoreApi<T> {
  let state: T;
  const listeners = new Set<(state: T, prevState: T) => void>();

  const getState = () => state;

  const setState: SetState<T> = (partial) => {
    const nextPartial =
      typeof partial === "function" ? (partial as (s: T) => Partial<T>)(state) : partial;
    if (nextPartial && !Object.is(nextPartial, state)) {
      const previousState = state;
      state = Object.assign({}, state, nextPartial);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };

  const subscribe = (listener: (state: T, prevState: T) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  state = initializer(setState, getState);

  const useStore = (<U = T>(selector?: (state: T) => U): U => {
    return useSyncExternalStore(
      subscribe,
      () => (selector ? selector(state) : (state as unknown as U)),
      () => (selector ? selector(state) : (state as unknown as U)),
    );
  }) as StoreApi<T>;

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore;
}
