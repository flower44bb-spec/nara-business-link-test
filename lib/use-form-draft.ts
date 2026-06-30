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
  const valueRef = useRef(value);
  const clearedRef = useRef(false);
  restoreRef.current = onRestore;
  valueRef.current = value;

  function saveDraft() {
    if (clearedRef.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(valueRef.current));
    } catch {
      // The form remains usable when storage is unavailable or full.
    }
  }

  useEffect(() => {
    setRestored(false);
    clearedRef.current = false;
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
      saveDraft();
    }, 300);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [enabled, key, restored, value]);

  useEffect(() => {
    if (!enabled || !restored) return;

    const saveOnHidden = () => {
      if (document.visibilityState === "hidden") saveDraft();
    };

    window.addEventListener("pagehide", saveDraft);
    document.addEventListener("visibilitychange", saveOnHidden);

    return () => {
      saveDraft();
      window.removeEventListener("pagehide", saveDraft);
      document.removeEventListener("visibilitychange", saveOnHidden);
    };
  }, [enabled, key, restored]);

  function clearDraft() {
    clearedRef.current = true;
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
