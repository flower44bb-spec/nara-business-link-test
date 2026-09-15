import type { BaseRecord, Profile } from "@/types";

export function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

export function isProfileMinimumComplete(profile?: Profile | null) {
  return Boolean(
    profile &&
      hasText(profile.full_name) &&
      hasText(profile.company_name) &&
      hasText(profile.local_chapter) &&
      hasText(profile.industry) &&
      hasText(profile.bio),
  );
}

export function isBusinessMinimumComplete(business?: BaseRecord | null) {
  return Boolean(business && hasText(String(business.services || "")));
}

export function isOnboardingComplete(profile?: Profile | null, business?: BaseRecord | null) {
  return isProfileMinimumComplete(profile) && isBusinessMinimumComplete(business);
}
