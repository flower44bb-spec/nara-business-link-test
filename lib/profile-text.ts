const circleMarkers = /[○⚪◯〇]/g;
const variationSelectors = /[\uFE0E\uFE0F]/g;
const bulletMarkerPattern = /[○⚪◯〇]|(^|[\s　])[・･/／]/m;

export function hasProfileItemMarkers(values: string[]) {
  return bulletMarkerPattern.test(values.join("\n"));
}

export function normalizeProfileItems(values: string[]) {
  const normalized = values
    .join("\n")
    .replace(/\r\n/g, "\n")
    .replace(circleMarkers, "○")
    .replace(variationSelectors, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const items: string[] = [];

  for (const line of normalized) {
    const segments = line
      .replace(/(?!^)(○)/g, "\n$1")
      .replace(/[\s　]+([・･/／])/g, "\n$1")
      .split("\n")
      .map((segment) => segment.trim())
      .filter(Boolean);

    for (const segment of segments) {
      if (isProfileItemStart(segment) || !items.length) {
        items.push(segment);
      } else {
        items[items.length - 1] = `${items[items.length - 1]}${segment}`;
      }
    }
  }

  return items;
}

function isProfileItemStart(value: string) {
  return /^[○・･/／]/.test(value);
}
