"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ApprovalGate } from "./approval-gate";
import { useAuth } from "./auth-provider";
import { supabase } from "@/lib/supabase";
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !isApproved) return;
    setSaving(true);
    setError("");
    let imageUrl = post?.image_url || null;
    if (image) {
      const path = `${user.id}/${Date.now()}.${image.name.split(".").pop() || "jpg"}`;
      const { error: uploadError } = await supabase.storage.from("marche-images").upload(path, image);
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
    const query = post
      ? supabase.from("marche_posts").update(payload).eq("id", post.id).select("id").single()
      : supabase.from("marche_posts").insert(payload).select("id").single();
    const { data, error: saveError } = await query;
    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }
    router.push(`/marche/${data.id}?saved=1`);
  }

  return (
    <ApprovalGate action="マルシェ案件の投稿・編集">
      <form onSubmit={submit}>
        {error && <p className="error">{error}</p>}
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
          <label htmlFor="image">画像</label>
          <input id="image" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        </div>
        <div className="form-actions">
          <button className="button secondary" type="button" onClick={() => router.back()}>キャンセル</button>
          <button className="button" type="submit" disabled={saving}>{saving ? "保存中..." : "保存して承認申請"}</button>
        </div>
      </form>
    </ApprovalGate>
  );
}
