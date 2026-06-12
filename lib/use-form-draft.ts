"use client";

import { useEffect, useRef, useState } from "react";

export function useFormDraft<T>({
  enabled = true,
  key,
  onRestore,
  value,
}: {
  enabled?: boolean;
  key: string;
  onRestore: (draft: T) => void;
  value: T;
}) {
  const [restored, setRestored] = useState(false);
  const restoreRef = useRef(onRestore);
  const timerRef = useRef<number | null>(null);
  restoreRef.current = onRestore;

  useEffect(() => {
    setRestored(false);
    if (!enabled) return;

    try {
      const stored = window.localStorage.getItem(key);
      if (stored) restoreRef.current(JSON.parse(stored) as T);
    } catch {
      window.localStorage.removeItem(key);
    }
    setRestored(true);
  }, [enabled, key]);

  useEffect(() => {
    if (!enabled || !restored) return;
    timerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // The form remains usable when storage is unavailable or full.
      }
    }, 300);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [enabled, key, restored, value]);

  function clearDraft() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }

  return { clearDraft, restored };
}
