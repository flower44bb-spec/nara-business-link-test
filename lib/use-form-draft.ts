"use client";

import { useEffect, useRef, useState } from "react";

export function useFormDraft<T>({
  enabled = true,
  fallbackKeys = [],
  key,
  onRestore,
  value,
}: {
  enabled?: boolean;
  fallbackKeys?: string[];
  key: string;
  onRestore: (draft: T) => void;
  value: T;
}) {
  const [restored, setRestored] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const restoreRef = useRef(onRestore);
  const valueRef = useRef(value);
  const clearedRef = useRef(false);
  restoreRef.current = onRestore;
  valueRef.current = value;
  const storageKeys = [key, ...fallbackKeys].filter(
    (item, index, array) => item && array.indexOf(item) === index,
  );

  function saveDraft() {
    if (clearedRef.current) return;
    for (const storageKey of storageKeys) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(valueRef.current));
      } catch {
        // The form remains usable when storage is unavailable or full.
      }
    }
  }

  useEffect(() => {
    setRestored(false);
    setHasDraft(false);
    clearedRef.current = false;
    if (!enabled) return;

    for (const storageKey of storageKeys) {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          restoreRef.current(JSON.parse(stored) as T);
          setHasDraft(true);
          break;
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setRestored(true);
  }, [enabled, key, fallbackKeys.join("|")]);

  useEffect(() => {
    if (!enabled || !restored) return;
    saveDraft();
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
    for (const storageKey of storageKeys) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Storage may be unavailable in private browsing.
      }
    }
  }

  return { clearDraft, hasDraft, restored };
}
