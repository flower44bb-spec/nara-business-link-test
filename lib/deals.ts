import type { DealStatus } from "@/types";

export const dealStatusLabels: Record<DealStatus, string> = {
  started: "商談開始",
  in_progress: "商談中",
  quoted: "見積提出",
  contracted: "成約",
  ongoing: "継続取引",
  closed: "終了",
};

export const dealStatusOptions: { value: DealStatus; label: string }[] = [
  { value: "started", label: dealStatusLabels.started },
  { value: "in_progress", label: dealStatusLabels.in_progress },
  { value: "quoted", label: dealStatusLabels.quoted },
  { value: "contracted", label: dealStatusLabels.contracted },
  { value: "ongoing", label: dealStatusLabels.ongoing },
  { value: "closed", label: dealStatusLabels.closed },
];

export function isContractedDeal(status?: string | null) {
  return status === "contracted" || status === "ongoing" || status === "closed";
}

export function formatDealAmount(amount?: number | null) {
  if (amount == null || Number.isNaN(Number(amount))) return "未入力";
  return `${Number(amount).toLocaleString("ja-JP")}円`;
}
