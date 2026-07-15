type FeaturedRecord = {
  created_at?: string | null;
  event_date?: string | null;
  featured_at?: string | null;
  is_featured?: boolean | null;
};

function timeValue(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function sortFeaturedFirst<T extends FeaturedRecord>(
  items: T[],
  fallbackDate: "created_at" | "event_date" = "created_at",
) {
  return [...items].sort((a, b) => {
    const featuredDiff = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
    if (featuredDiff !== 0) return featuredDiff;

    if (a.is_featured || b.is_featured) {
      const featuredTimeDiff = timeValue(b.featured_at) - timeValue(a.featured_at);
      if (featuredTimeDiff !== 0) return featuredTimeDiff;
    }

    return timeValue(b[fallbackDate]) - timeValue(a[fallbackDate]);
  });
}
