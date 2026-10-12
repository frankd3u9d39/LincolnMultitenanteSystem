'use client';

import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/services/api';

export interface AsyncState<T> {
  data: T | null;
  /** True until the first response (or failure) arrives. */
  loading: boolean;
  /** True while a refresh is in flight and earlier data is still on screen. */
  refreshing: boolean;
  error: string | null;
  reload: () => void;
  /** Replaces the loaded data, for optimistic updates after a mutation. */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Loads data when the dependencies change and aborts the previous request, so a
 * slow response for an old filter can never overwrite a newer one.
 */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const loaded = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    // Deferred a tick so state is not set synchronously inside the effect body.
    queueMicrotask(() => {
      if (controller.signal.aborted) {
        return;
      }
      if (loaded.current) {
        setRefreshing(true);
      }
      setError(null);
    });

    load(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        loaded.current = true;
        setData(result);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((failure: unknown) => {
        if (controller.signal.aborted || (failure instanceof DOMException && failure.name === 'AbortError')) {
          return;
        }
        setError(failure instanceof ApiError ? failure.message : 'Something went wrong loading this page.');
        setLoading(false);
        setRefreshing(false);
      });

    return () => controller.abort();
    // The caller's dependency list is the contract for when to reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  return { data, loading, refreshing, error, reload, setData };
}
