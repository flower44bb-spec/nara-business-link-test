"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ApprovalGate } from "@/components/approval-gate";
import { ImageCropper } from "@/components/image-cropper";
import { insertRecord, updateRecord } from "@/lib/mutations";
import { supabase } from "@/lib/supabase";
import { useFormDraft } from "@/lib/use-form-draft";
import type { BaseRecord, BusinessDeal, Profile, ResourceConfig } from "@/types";

export function ResourceForm({
  config,
  item,
  dealId,
}: {
  config: ResourceConfig;
  item?: BaseRecord;
  dealId?: string | null;
}) {
  const router = useRouter();
  const { user, isApproved, isAdmin, loading: authLoading } = useAuth();
  const sourceDealId = config.table === "successes" && !item ? dealId : null;
  const [title, setTitle] = useState(String(item?.title || ""));
  const [category, setCategory] = useState(String(item?.category || ""));
  const [area, setArea] = useState(String(item?.area || ""));
  const [description, setDescription] = useState(
    String(item?.description || item?.detail || item?.content || ""),
  );
  const [result, setResult] = useState(String(item?.result || ""));
  const [transactionAmount, setTransactionAmount] = useState(
    item?.transaction_amount == null ? "" : String(item.transaction_amount),
  );
  const [image, setImage] = useState<File | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [sourceDeal, setSourceDeal] = useState<BusinessDeal | null>(null);
  const [counterpartName, setCounterpartName] = useState("");
  const [introducerName, setIntroducerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const draft = { title, category, area, description, result, transactionAmount };
  const { clearDraft, isEditingElsewhere } = useFormDraft({
    key: `draft:${config.table}:${item?.id || "new"}`,
    fallbackKeys: [`draft:${config.table}:${item?.id || "new"}:${user?.id || "guest"}`],
    value: draft,
    enabled: Boolean(user),
    onRestore: (saved) => {
      setTitle(saved.title);
      setCategory(saved.category);
      setArea(saved.area);
      setDescription(saved.description);
      setResult(saved.result);
      setTransactionAmount(saved.transactionAmount);
    },
  });

  useEffect(() => {
    if (!sourceDealId || item) return;
    async function loadDeal() {
      const { data } = await supabase.from("business_deals").select("*").eq("id", sourceDealId).single();
      if (!data) return;
      const deal = data as BusinessDeal;
      setSourceDeal(deal);
      setTitle(`成功事例：${deal.title}`);
      setCategory(deal.category || "");
      setArea(deal.area || "");
      setDescription(deal.description || "");
      setTransactionAmount(deal.amount == null ? "" : String(deal.amount));
      const ids = [deal.requester_id, deal.contractor_id, deal.introducer_id].filter(Boolean) as string[];
      if (!ids.length) return;
      const { data: profiles } = await supabase.from("public_profiles").select("*").in("id", ids);
      const profileMap = new Map(((profiles as Profile[]) ?? []).map((profile) => [profile.id, profile]));
      const requester = profileMap.get(deal.requester_id);
      const contractor = profileMap.get(deal.contractor_id);
      const introducer = deal.introducer_id ? profileMap.get(deal.introducer_id) : undefined;
      setCounterpartName([requester?.company_name || requester?.full_name, contractor?.company_name || contractor?.full_name].filter(Boolean).join(" × "));
      setIntroducerName(introducer?.full_name || introducer?.company_name || "");
    }
    loadDeal();
  }, [item, sourceDealId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !isApproved) {
      router.push("/auth");
      return;
    }
    setSaving(true);
    setError("");
    if (imageProcessing) {
      setError("画像の表示範囲を反映中です。完了してから保存してください。");
      setSaving(false);
      return;
    }
    let imageUrl = String(item?.image_url || "");
    if (config.table === "successes" && image) {
      const path = `${user.id}/successes/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("business-images").upload(path, image, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        setError(`画像をアップロードできませんでした: ${uploadError.message}`);
        setSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("business-images").getPublicUrl(path).data.publicUrl;
    }
    const payload = {
      title,
      category,
      area,
      description,
      detail: description,
      content: description,
      image_url: config.table === "successes" ? imageUrl || null : undefined,
      result: config.table === "successes" ? result : undefined,
      transaction_amount:
        config.table === "successes" && transactionAmount
          ? Number(transactionAmount)
          : null,
      deal_id: config.table === "successes" ? sourceDealId : undefined,
      counterpart_name: config.table === "successes" ? counterpartName || null : undefined,
      introducer_name: config.table === "successes" ? introducerName || null : undefined,
      related_post_type: config.table === "successes" ? sourceDeal?.source_type || null : undefined,
      related_post_id: config.table === "successes" ? sourceDeal?.source_id || null : undefined,
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
    if (config.table === "successes" && sourceDealId) {
      await supabase
        .from("business_deals")
        .update({ success_id: saved.id, success_created_at: new Date().toISOString() })
        .eq("id", sourceDealId);
    }
    clearDraft();
    router.push(`/${config.table}/${saved.id}?saved=${item ? "edit" : "new"}`);
    router.refresh();
  }

  if (authLoading) return <p>認証情報を確認しています...</p>;
  if (!user || !isApproved) return <ApprovalGate action={`${config.label}の投稿`}><span /></ApprovalGate>;

  return (
    <form onSubmit={submit}>
      {error && <p className="error">{error}</p>}
      <p className="draft-note">入力内容はこの端末に一時保存されます。</p>
      {sourceDeal && (
        <p className="notice">
          商談「{sourceDeal.title}」から成功事例を作成しています。タイトル・カテゴリ・地域・商談内容・成約金額を自動入力しました。
        </p>
      )}
      {isEditingElsewhere && (
        <p className="pending-banner">
          別のウインドウでも同じフォームを編集中です。このウインドウの入力内容は個別に一時保存されます。
        </p>
      )}
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
          {sourceDeal && (
            <>
              <div className="field">
                <label htmlFor="counterpart_name">相手事業者</label>
                <input id="counterpart_name" value={counterpartName} onChange={(event) => setCounterpartName(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="introducer_name">紹介者</label>
                <input id="introducer_name" value={introducerName} onChange={(event) => setIntroducerName(event.target.value)} placeholder="紹介者がいない場合は空欄" />
              </div>
            </>
          )}
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
          <div className="field">
            <label>成功事例画像</label>
            <ImageCropper
              currentImageUrl={String(item?.image_url || "")}
              onChange={setImage}
              onProcessingChange={setImageProcessing}
              imageLabel="成功事例画像"
            />
          </div>
        </>
      )}
      <div className="form-actions">
        <button className="button secondary" type="button" onClick={() => router.back()}>キャンセル</button>
        <button className="button" type="submit" disabled={saving || imageProcessing}>
          {saving
            ? "保存中..."
            : imageProcessing
              ? "画像を反映中..."
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
