"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isProfileMinimumComplete, isBusinessMinimumComplete } from "@/lib/onboarding";
import { supabase } from "@/lib/supabase";
import type { BaseRecord } from "@/types";
import { useAuth } from "./auth-provider";

const PUBLIC_PATH_PREFIXES = [
  "/auth",
  "/onboarding",
];

export function OnboardingGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [businessReady, setBusinessReady] = useState<boolean | null>(null);

  useEffect(() => {
    setBusinessReady(null);
    if (!user || !profile || !isProfileMinimumComplete(profile)) return;

    let active = true;
    supabase
      .from("businesses")
      .select("id, services")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!active) return;
        const businesses = (data as BaseRecord[]) ?? [];
        setBusinessReady(businesses.some((business) => isBusinessMinimumComplete(business)));
      });

    return () => {
      active = false;
    };
  }, [profile, user]);

  useEffect(() => {
    if (loading || !user || !profile) return;
    if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    if (!isProfileMinimumComplete(profile)) {
      router.replace("/onboarding");
      return;
    }
    if (businessReady === false) router.replace("/onboarding");
  }, [businessReady, loading, pathname, profile, router, user]);

  return null;
}
