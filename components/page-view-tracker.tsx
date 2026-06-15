"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const VISITOR_KEY = "nara-business-link-visitor";
const SESSION_KEY = "nara-business-link-session";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const timer = window.setTimeout(() => {
      const visitorId = storedId(window.localStorage, VISITOR_KEY);
      const sessionId = storedId(window.sessionStorage, SESSION_KEY);
      const referrerHost = safeHost(document.referrer);

      void fetch("/api/analytics/page-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          visitorId,
          sessionId,
          referrerHost,
          deviceType: deviceType(),
        }),
        keepalive: true,
      });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}

function storedId(storage: Storage, key: string) {
  try {
    const current = storage.getItem(key);
    if (current) return current;
    const created = crypto.randomUUID();
    storage.setItem(key, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function safeHost(value: string) {
  if (!value) return null;
  try {
    const host = new URL(value).hostname;
    return host === window.location.hostname ? null : host;
  } catch {
    return null;
  }
}

function deviceType() {
  const width = window.innerWidth;
  if (width < 700) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}
