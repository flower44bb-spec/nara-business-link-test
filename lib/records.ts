import type { BaseRecord } from "@/types";

export function recordTitle(record: BaseRecord) {
  return String(record.name || record.title || "名称未設定");
}

export function recordDescription(record: BaseRecord) {
  return String(
    record.description || record.detail || record.content || "詳細は登録されていません。",
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export function isMissingColumnError(message: string) {
  return /column|schema cache/i.test(message);
}

export function missingColumn(message: string) {
  const match =
    message.match(/Could not find the '([^']+)' column/i) ||
    message.match(/column ["']?([^"' ]+)["']? .* does not exist/i);
  return match?.[1];
}
