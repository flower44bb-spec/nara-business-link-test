"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

const VISITOR_KEY = "nara-business-link-visitor";
const SESSION_KEY = "nara-business-link-session";

export function PageViewTracker() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !pathname || pathname.startsWith("/admin")) return;

    const timer = window.setTimeout(() => {
      const visitorId = storedId(window.localStorage, VISITOR_KEY);
      const sessionId = storedId(window.sessionStorage, SESSION_KEY);
      const referrerHost = safeHost(document.referrer);

      void supabase.from("page_views").insert({
        path: pathname,
        visitor_id: visitorId,
        session_id: sessionId,
        user_id: user?.id || null,
        referrer_host: referrerHost,
        device_type: deviceType(),
      });
    }, 600);

    return () => window.clearTimeout(timer);
  }, [loading, pathname, user?.id]);

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
