"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApprovalGate } from "./approval-gate";
import { useAuth } from "./auth-provider";
import { ImageCropper } from "./image-cropper";
import { insertRecord, updateRecord } from "@/lib/mutations";
import { supabase } from "@/lib/supabase";
import { useFormDraft } from "@/lib/use-form-draft";
import type { MarchePost } from "@/types";

export function MarcheForm({ post }: { post?: MarchePost }) {
  const router = useRouter();
  const { user, isApproved, isAdmin } = useAuth();
  const [form, setForm] = useState({
    event_type: post?.event_type || "地域イベントPR",
    event_name: post?.event_name || "",
    event_date: post?.event_date || "",
    location: post?.location || "",
    organizer_type: post?.organizer_type || "青年部主催",
    target_audience: post?.target_audience || "",
    desired_industries: post?.desired_industries || "",
    description: post?.description || "",
    application_deadline: post?.application_deadline || "",
    booth_fee: post?.booth_fee || "",
    organizer: post?.organizer || "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { clearDraft, isEditingElsewhere } = useFormDraft({
    key: `draft:marche:${post?.id || "new"}`,
    fallbackKeys: [`draft:marche:${post?.id || "new"}:${user?.id || "guest"}`],
    value: form,
    enabled: Boolean(user),
    onRestore: (saved) => {
      setForm((current) => ({ ...current, ...saved }));
    },
  });

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !isApproved) return;
    if (imageProcessing) {
      setError("画像の表示範囲を反映中です。完了してから保存してください。");
      return;
    }
    setSaving(true);
    setError("");
    let imageUrl = post?.image_url || null;
    if (image) {
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("marche-images").upload(path, image, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("marche-images").getPublicUrl(path).data.publicUrl;
    }
    const payload = {
      ...form,
      application_deadline: form.application_deadline || null,
      image_url: imageUrl,
      user_id: user.id,
      approval_status: isAdmin ? post?.approval_status || "approved" : "pending",
      updated_at: new Date().toISOString(),
    };
    let { data, error: saveError } = post
      ? await updateRecord("marche_posts", post.id, payload)
      : await insertRecord("marche_posts", payload);
    if (saveError && /event_type|organizer_type|target_audience|schema cache|column/i.test(saveError.message)) {
      const { event_type, organizer_type, target_audience, ...legacyPayload } = payload;
      const fallbackDescription = [
        form.description,
        "",
        `【掲載種別】${event_type || "未設定"}`,
        `【主催区分】${organizer_type || "未設定"}`,
        `【対象者】${target_audience || "指定なし"}`,
      ].join("\n");
      const fallbackPayload = { ...legacyPayload, description: fallbackDescription };
      const fallbackResult = post
        ? await updateRecord("marche_posts", post.id, fallbackPayload)
        : await insertRecord("marche_posts", fallbackPayload);
      data = fallbackResult.data;
      saveError = fallbackResult.error;
    }
    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }
    clearDraft();
    router.push(`/marche/${data.id}?saved=${post ? "edit" : "new"}`);
  }

  return (
    <ApprovalGate action="イベント情報の投稿・編集">
      <form onSubmit={submit}>
        {error && <p className="error">{error}</p>}
        <p className="draft-note">入力内容はこの端末に一時保存されます。画像は再選択が必要です。</p>
        {isEditingElsewhere && (
          <p className="pending-banner">
            別のウインドウでも同じフォームを編集中です。このウインドウの入力内容は個別に一時保存されます。
          </p>
        )}
        <div className="field">
          <label htmlFor="event_type">掲載種別 *</label>
          <select id="event_type" value={form.event_type} onChange={(e) => set("event_type", e.target.value)} required>
            <option value="地域イベントPR">地域イベントPR</option>
            <option value="マルシェ">マルシェ</option>
            <option value="出店募集">出店募集</option>
            <option value="青年部事業">青年部事業</option>
            <option value="企業主催イベント">企業主催イベント</option>
            <option value="その他">その他</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="event_name">イベント名 *</label>
          <input id="event_name" type="text" value={form.event_name} onChange={(e) => set("event_name", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="event_date">開催日 *</label>
          <input id="event_date" type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="location">開催場所 *</label>
          <input id="location" type="text" placeholder="例：奈良市、橿原市、会場名など" value={form.location} onChange={(e) => set("location", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="organizer_type">主催区分 *</label>
          <select id="organizer_type" value={form.organizer_type} onChange={(e) => set("organizer_type", e.target.value)} required>
            <option value="青年部主催">青年部主催</option>
            <option value="企業主催">企業主催</option>
            <option value="行政・団体主催">行政・団体主催</option>
            <option value="共同主催">共同主催</option>
            <option value="その他">その他</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="organizer">主催者名 *</label>
          <input id="organizer" type="text" placeholder="例：奈良県商工会青年部連合会、〇〇商工会青年部、株式会社〇〇" value={form.organizer} onChange={(e) => set("organizer", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="target_audience">対象者</label>
          <input id="target_audience" type="text" placeholder="例：地域住民、親子連れ、観光客、事業者、出店希望者" value={form.target_audience} onChange={(e) => set("target_audience", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="desired_industries">募集内容・募集業種</label>
          <textarea id="desired_industries" placeholder="出店募集がある場合は、募集業種や募集内容を記入してください。PRのみの場合は空欄でも構いません。" value={form.desired_industries} onChange={(e) => set("desired_industries", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="description">イベント内容・PR文 *</label>
          <textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="application_deadline">申込・募集締切</label>
          <input id="application_deadline" type="date" value={form.application_deadline} onChange={(e) => set("application_deadline", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="booth_fee">出店料・参加費</label>
          <input id="booth_fee" type="text" placeholder="例：無料、1区画3,000円、参加費500円" value={form.booth_fee} onChange={(e) => set("booth_fee", e.target.value)} />
        </div>
        <div className="field">
          <label>画像</label>
          <ImageCropper
            currentImageUrl={post?.image_url}
            onChange={setImage}
            onProcessingChange={setImageProcessing}
            imageLabel="イベント画像"
          />
        </div>
        <div className="form-actions">
          <button className="button secondary" type="button" onClick={() => router.back()}>キャンセル</button>
          <button className="button" type="submit" disabled={saving || imageProcessing}>
            {saving ? "保存中..." : imageProcessing ? "画像を反映中..." : "保存して承認申請"}
          </button>
        </div>
      </form>
    </ApprovalGate>
  );
}
