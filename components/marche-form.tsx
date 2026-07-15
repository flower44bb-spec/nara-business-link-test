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
    event_name: post?.event_name || "",
    event_date: post?.event_date || "",
    location: post?.location || "",
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
    onRestore: setForm,
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
    const { data, error: saveError } = post
      ? await updateRecord("marche_posts", post.id, payload)
      : await insertRecord("marche_posts", payload);
    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }
    clearDraft();
    router.push(`/marche/${data.id}?saved=${post ? "edit" : "new"}`);
  }

  return (
    <ApprovalGate action="マルシェ案件の投稿・編集">
      <form onSubmit={submit}>
        {error && <p className="error">{error}</p>}
        <p className="draft-note">入力内容はこの端末に一時保存されます。画像は再選択が必要です。</p>
        {isEditingElsewhere && (
          <p className="pending-banner">
            別のウインドウでも同じフォームを編集中です。このウインドウの入力内容は個別に一時保存されます。
          </p>
        )}
        {[
          ["event_name", "イベント名", "text"], ["event_date", "開催日", "date"],
          ["location", "開催場所", "text"], ["desired_industries", "募集業種", "text"],
          ["application_deadline", "募集締切", "date"], ["booth_fee", "出店料", "text"],
          ["organizer", "主催者", "text"],
        ].map(([key, label, type]) => (
          <div className="field" key={key}>
            <label htmlFor={key}>{label}{["event_name", "event_date", "location", "organizer"].includes(key) ? " *" : ""}</label>
            <input id={key} type={type} value={form[key as keyof typeof form]} onChange={(e) => set(key as keyof typeof form, e.target.value)} required={["event_name", "event_date", "location", "organizer"].includes(key)} />
          </div>
        ))}
        <div className="field">
          <label htmlFor="description">募集内容 *</label>
          <textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} required />
        </div>
        <div className="field">
          <label>画像</label>
          <ImageCropper
            currentImageUrl={post?.image_url}
            onChange={setImage}
            onProcessingChange={setImageProcessing}
            imageLabel="マルシェ画像"
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
