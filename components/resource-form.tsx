"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ApprovalGate } from "@/components/approval-gate";
import { insertRecord, updateRecord } from "@/lib/mutations";
import type { BaseRecord, ResourceConfig } from "@/types";

export function ResourceForm({
  config,
  item,
}: {
  config: ResourceConfig;
  item?: BaseRecord;
}) {
  const router = useRouter();
  const { user, isApproved, isAdmin, loading: authLoading } = useAuth();
  const [title, setTitle] = useState(String(item?.title || ""));
  const [category, setCategory] = useState(String(item?.category || ""));
  const [area, setArea] = useState(String(item?.area || ""));
  const [description, setDescription] = useState(String(item?.description || item?.detail || ""));
  const [result, setResult] = useState(String(item?.result || ""));
  const [transactionAmount, setTransactionAmount] = useState(
    item?.transaction_amount == null ? "" : String(item.transaction_amount),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !isApproved) {
      router.push("/auth");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      title,
      category,
      area,
      description,
      result: config.table === "successes" ? result : undefined,
      transaction_amount:
        config.table === "successes" && transactionAmount
          ? Number(transactionAmount)
          : null,
      user_id: item?.user_id || user.id,
      approval_status: isAdmin ? item?.approval_status || "approved" : "pending",
    };
    const { data, error: saveError } = item
      ? await updateRecord(config.table, String(item.id), payload)
      : await insertRecord(config.table, payload);

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }
    const saved = data as BaseRecord;
    router.push(`/${config.table}/${saved.id}?saved=${item ? "edit" : "new"}`);
    router.refresh();
  }

  if (authLoading) return <p>認証情報を確認しています...</p>;
  if (!user || !isApproved) return <ApprovalGate action={`${config.label}の投稿`}><span /></ApprovalGate>;

  return (
    <form onSubmit={submit}>
      {error && <p className="error">{error}</p>}
      <div className="field">
        <label htmlFor="title">タイトル *</label>
        <input id="title" placeholder={config.titlePlaceholder} value={title} onChange={(event) => setTitle(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="category">分野・カテゴリ</label>
        <input id="category" placeholder="例：集客、商品開発、飲食業 × 農業" value={category} onChange={(event) => setCategory(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="area">地域</label>
        <input id="area" placeholder="例：奈良市、県内全域" value={area} onChange={(event) => setArea(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="description">詳細 *</label>
        <textarea id="description" placeholder={config.descriptionPlaceholder} value={description} onChange={(event) => setDescription(event.target.value)} required />
      </div>
      {config.table === "successes" && (
        <>
          <div className="field">
            <label htmlFor="result">成果</label>
            <textarea id="result" placeholder="売上、継続取引、来場者数など、連携によって生まれた成果をご記入ください。" value={result} onChange={(event) => setResult(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="transaction_amount">取引金額（任意・円）</label>
            <input
              id="transaction_amount"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="例：500000"
              value={transactionAmount}
              onChange={(event) => setTransactionAmount(event.target.value)}
            />
          </div>
        </>
      )}
      <div className="form-actions">
        <button className="button secondary" type="button" onClick={() => router.back()}>キャンセル</button>
        <button className="button" type="submit" disabled={saving}>
          {saving
            ? "保存中..."
            : item
              ? isAdmin
                ? "変更を保存"
                : "変更を保存（再承認）"
              : `${config.singular}を投稿（承認申請）`}
        </button>
      </div>
    </form>
  );
}
