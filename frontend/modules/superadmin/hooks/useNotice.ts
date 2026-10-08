'use client';

import { useCallback, useRef, useState } from 'react';

export type NoticeTone = 'success' | 'info' | 'warning';

export interface Notice {
  tone: NoticeTone;
  message: string;
}

/**
 * Transient confirmation messages shown after an action completes.
 * Replaces the browser `alert()` with an inline, dismissible banner.
 */
export function useNotice(timeoutMs = 6000) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setNotice(null);
  }, []);

  const notify = useCallback(
    (message: string, tone: NoticeTone = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setNotice({ message, tone });
      timer.current = setTimeout(() => setNotice(null), timeoutMs);
    },
    [timeoutMs]
  );

  return { notice, notify, dismiss };
}
