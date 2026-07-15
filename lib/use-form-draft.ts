"use client";

import { useEffect, useRef, useState } from "react";

const WINDOW_ID_KEY = "nara-business-link:draft-window-id";
const ACTIVE_TIMEOUT_MS = 20000;

type DraftEnvelope<T> = {
  value: T;
  windowId: string;
  updatedAt: number;
};

type ActiveEditors = Record<string, number>;

function getWindowId() {
  try {
    const stored = window.sessionStorage.getItem(WINDOW_ID_KEY);
    if (stored) return stored;
    const next = crypto.randomUUID();
    window.sessionStorage.setItem(WINDOW_ID_KEY, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
}

function parseDraft<T>(stored: string): T {
  const parsed = JSON.parse(stored) as DraftEnvelope<T> | T;
  if (
    parsed &&
    typeof parsed === "object" &&
    "value" in parsed &&
    "windowId" in parsed &&
    "updatedAt" in parsed
  ) {
    return (parsed as DraftEnvelope<T>).value;
  }
  return parsed as T;
}

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
  const [isEditingElsewhere, setIsEditingElsewhere] = useState(false);
  const restoreRef = useRef(onRestore);
  const valueRef = useRef(value);
  const clearedRef = useRef(false);
  const windowIdRef = useRef<string | null>(null);
  restoreRef.current = onRestore;
  valueRef.current = value;
  const storageKeys = [key, ...fallbackKeys].filter(
    (item, index, array) => item && array.indexOf(item) === index,
  );
  const activeKey = `${key}:active-editor`;

  function getScopedKey(storageKey: string) {
    if (!windowIdRef.current) windowIdRef.current = getWindowId();
    return `${storageKey}:window:${windowIdRef.current}`;
  }

  function rememberScopedKey(storageKey: string, scopedKey: string) {
    try {
      const indexKey = `${storageKey}:draft-windows`;
      const stored = window.localStorage.getItem(indexKey);
      const keys = stored ? (JSON.parse(stored) as string[]) : [];
      if (!keys.includes(scopedKey)) {
        window.localStorage.setItem(indexKey, JSON.stringify([...keys, scopedKey]));
      }
    } catch {
      // Draft cleanup remains best-effort.
    }
  }

  function writeActiveEditor() {
    if (!windowIdRef.current) windowIdRef.current = getWindowId();
    try {
      const stored = window.localStorage.getItem(activeKey);
      const active = stored ? (JSON.parse(stored) as ActiveEditors) : {};
      const now = Date.now();
      const next = Object.fromEntries(
        Object.entries(active).filter(([, updatedAt]) => now - updatedAt < ACTIVE_TIMEOUT_MS),
      ) as ActiveEditors;
      next[windowIdRef.current] = now;
      window.localStorage.setItem(
        activeKey,
        JSON.stringify(next),
      );
    } catch {
      // Editing still works when storage is unavailable.
    }
  }

  function checkActiveEditor() {
    if (!windowIdRef.current) windowIdRef.current = getWindowId();
    try {
      const stored = window.localStorage.getItem(activeKey);
      if (!stored) {
        setIsEditingElsewhere(false);
        return;
      }
      const active = JSON.parse(stored) as ActiveEditors;
      const now = Date.now();
      setIsEditingElsewhere(
        Object.entries(active).some(
          ([activeWindowId, updatedAt]) =>
            activeWindowId !== windowIdRef.current && now - updatedAt < ACTIVE_TIMEOUT_MS,
        ),
      );
    } catch {
      setIsEditingElsewhere(false);
    }
  }

  function saveDraft() {
    if (clearedRef.current) return;
    for (const storageKey of storageKeys) {
      const scopedKey = getScopedKey(storageKey);
      const envelope: DraftEnvelope<T> = {
        value: valueRef.current,
        windowId: windowIdRef.current || getWindowId(),
        updatedAt: Date.now(),
      };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(envelope));
        window.localStorage.setItem(scopedKey, JSON.stringify(envelope));
        rememberScopedKey(storageKey, scopedKey);
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
    if (!windowIdRef.current) windowIdRef.current = getWindowId();

    for (const storageKey of storageKeys) {
      const candidates = [getScopedKey(storageKey), storageKey];
      try {
        for (const candidate of candidates) {
          const stored = window.localStorage.getItem(candidate);
          if (stored) {
            restoreRef.current(parseDraft<T>(stored));
            setHasDraft(true);
            setRestored(true);
            checkActiveEditor();
            return;
          }
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setRestored(true);
  }, [enabled, key, fallbackKeys.join("|")]);

  useEffect(() => {
    if (!enabled || !restored) return;
    writeActiveEditor();
    saveDraft();
  }, [enabled, key, restored, value]);

  useEffect(() => {
    if (!enabled || !restored) return;

    const saveOnHidden = () => {
      if (document.visibilityState === "hidden") saveDraft();
    };

    window.addEventListener("pagehide", saveDraft);
    document.addEventListener("visibilitychange", saveOnHidden);
    window.addEventListener("storage", checkActiveEditor);
    const activeTimer = window.setInterval(() => {
      writeActiveEditor();
      checkActiveEditor();
    }, 5000);

    return () => {
      saveDraft();
      window.removeEventListener("pagehide", saveDraft);
      document.removeEventListener("visibilitychange", saveOnHidden);
      window.removeEventListener("storage", checkActiveEditor);
      window.clearInterval(activeTimer);
    };
  }, [enabled, key, restored]);

  function clearDraft() {
    clearedRef.current = true;
    if (!windowIdRef.current) windowIdRef.current = getWindowId();
    for (const storageKey of storageKeys) {
      try {
        window.localStorage.removeItem(storageKey);
        window.localStorage.removeItem(getScopedKey(storageKey));
        const indexKey = `${storageKey}:draft-windows`;
        const stored = window.localStorage.getItem(indexKey);
        const scopedKeys = stored ? (JSON.parse(stored) as string[]) : [];
        for (const scopedKey of scopedKeys) window.localStorage.removeItem(scopedKey);
        window.localStorage.removeItem(indexKey);
      } catch {
        // Storage may be unavailable in private browsing.
      }
    }
    try {
      const stored = window.localStorage.getItem(activeKey);
      const active = stored ? (JSON.parse(stored) as ActiveEditors) : {};
      delete active[windowIdRef.current];
      window.localStorage.setItem(activeKey, JSON.stringify(active));
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }

  return { clearDraft, hasDraft, isEditingElsewhere, restored };
}
