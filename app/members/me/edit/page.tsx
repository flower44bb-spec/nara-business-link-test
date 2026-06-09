"use client";

import { FormEvent, useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ApprovalGate } from "@/components/approval-gate";
import { useAuth } from "@/components/auth-provider";
import { BackLink, PageHero } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function EditMyProfilePage() {
  const router = useRouter();
  const { user, profile, isApproved, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: "", local_chapter: "", position: "", company_name: "", industry: "",
    bio: "", can_help_with: "", wants_to_connect_with: "", line_notify_target: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [lineEnabled, setLineEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
      full_name: profile.full_name || "",
      local_chapter: profile.local_chapter || "",
      position: profile.position || "",
      company_name: profile.company_name || "",
      industry: profile.industry || "",
      bio: profile.bio || "",
      can_help_with: profile.can_help_with || "",
      wants_to_connect_with: profile.wants_to_connect_with || "",
      line_notify_target: profile.line_notify_target || "",
      });
      setLineEnabled(Boolean(profile.line_notifications_enabled));
    }
  }, [profile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !isApproved) return;
    setSaving(true);
    setError("");
    let avatarUrl = profile?.avatar_url || null;
    if (image) {
      const extension = image.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("profile-images").upload(path, image);
      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }
      avatarUrl = supabase.storage.from("profile-images").getPublicUrl(path).data.publicUrl;
    }
    const { error: updateError } = await supabase.from("profiles").update({
      ...form, avatar_url: avatarUrl, line_notifications_enabled: lineEnabled, updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    await refreshProfile();
    router.push(`/members/${user.id}`);
  }

  function field(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main>
      <PageHero eyebrow="Edit Profile" title="プロフィール編集" description="あなたの経験や相談できることを登録し、青年部内のつながりを広げましょう。" />
      <section className="page-content">
        <div className="container">
          <BackLink href={user ? `/members/${user.id}` : "/members"} />
          <div className="form-card">
            <ApprovalGate action="プロフィール編集">
              <form onSubmit={submit}>
                {error && <p className="error">{error}</p>}
                {[
                  ["full_name", "氏名"], ["local_chapter", "所属単会"], ["position", "役職"],
                  ["company_name", "会社名"], ["industry", "業種"],
                ].map(([key, label]) => (
                  <div className="field" key={key}>
                    <label htmlFor={key}>{label}</label>
                    <input id={key} value={form[key as keyof typeof form]} onChange={(e) => field(key as keyof typeof form, e.target.value)} />
                  </div>
                ))}
                {[
                  ["bio", "自己紹介"], ["can_help_with", "相談できること"],
                  ["wants_to_connect_with", "つながりたい業種"],
                ].map(([key, label]) => (
                  <div className="field" key={key}>
                    <label htmlFor={key}>{label}</label>
                    <textarea id={key} value={form[key as keyof typeof form]} onChange={(e) => field(key as keyof typeof form, e.target.value)} />
                  </div>
                ))}
                <div className="field">
                  <label htmlFor="avatar"><ImagePlus size={17} /> プロフィール画像</label>
                  <input id="avatar" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
                </div>
                <div className="field">
                  <label htmlFor="line_notify_target">LINE通知先（将来連携用）</label>
                  <input id="line_notify_target" value={form.line_notify_target} onChange={(e) => field("line_notify_target", e.target.value)} placeholder="LINE User IDなど" />
                </div>
                <label className="check-field">
                  <input type="checkbox" checked={lineEnabled} onChange={(e) => setLineEnabled(e.target.checked)} />
                  LINE通知を有効にする（API接続後に配信）
                </label>
                <button className="button" type="submit" disabled={saving}>{saving ? "保存中..." : "プロフィールを保存"}</button>
              </form>
            </ApprovalGate>
          </div>
        </div>
      </section>
    </main>
  );
}
