"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApprovalGate } from "@/components/approval-gate";
import { useAuth } from "@/components/auth-provider";
import { ImageCropper } from "@/components/image-cropper";
import { BackLink, PageHero } from "@/components/ui";
import { updateRecord } from "@/lib/mutations";
import { supabase } from "@/lib/supabase";
import { useFormDraft } from "@/lib/use-form-draft";

export default function EditMyProfilePage() {
  const router = useRouter();
  const { user, profile, isApproved, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: "", local_chapter: "", position: "", company_name: "", industry: "",
    bio: "", can_help_with: "", wants_to_connect_with: "", website_url: "", sns_url: "", line_notify_target: "",
    qualifications: "", specialties: "", available_work: "", service_areas: "", experience_years: "",
    portfolio_url: "", homepage_url: "", instagram_url: "", facebook_url: "", x_url: "", other_sns_url: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [lineEnabled, setLineEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [profileApplied, setProfileApplied] = useState(false);

  const { clearDraft, hasDraft, isEditingElsewhere, restored } = useFormDraft({
    key: `draft:profile:${user?.id || "guest"}`,
    value: { form, lineEnabled },
    enabled: Boolean(user && profile),
    onRestore: (saved) => {
      setForm(saved.form);
      setLineEnabled(saved.lineEnabled);
    },
  });

  useEffect(() => {
    if (!profile || !restored || hasDraft || profileApplied) return;
    setForm({
      full_name: profile.full_name || "",
      local_chapter: profile.local_chapter || "",
      position: profile.position || "",
      company_name: profile.company_name || "",
      industry: profile.industry || "",
      bio: profile.bio || "",
      can_help_with: profile.can_help_with || "",
      wants_to_connect_with: profile.wants_to_connect_with || "",
      website_url: profile.website_url || "",
      sns_url: profile.sns_url || "",
      line_notify_target: profile.line_notify_target || "",
      qualifications: (profile.qualifications || []).join("、"),
      specialties: (profile.specialties || []).join("、"),
      available_work: profile.available_work || "",
      service_areas: (profile.service_areas || []).join("、"),
      experience_years: profile.experience_years || "",
      portfolio_url: profile.portfolio_url || "",
      homepage_url: profile.homepage_url || "",
      instagram_url: profile.instagram_url || "",
      facebook_url: profile.facebook_url || "",
      x_url: profile.x_url || "",
      other_sns_url: profile.other_sns_url || "",
    });
    setLineEnabled(Boolean(profile.line_notifications_enabled));
    setProfileApplied(true);
  }, [hasDraft, profile, profileApplied, restored]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (imageProcessing) {
      setError("画像の表示範囲を反映中です。完了してから保存してください。");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    let avatarUrl = profile?.avatar_url || null;
    if (image) {
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("profile-images").upload(path, image, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        setError(`プロフィール画像をアップロードできませんでした: ${uploadError.message}`);
        setSaving(false);
        return;
      }
      avatarUrl = supabase.storage.from("profile-images").getPublicUrl(path).data.publicUrl;
    }
    const { error: updateError } = await updateRecord("profiles", user.id, {
      ...form,
      qualifications: splitTags(form.qualifications),
      specialties: splitTags(form.specialties),
      service_areas: splitTags(form.service_areas),
      avatar_url: avatarUrl,
      line_notifications_enabled: lineEnabled,
      updated_at: new Date().toISOString(),
    });
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    clearDraft();
    await refreshProfile();
    setSaving(false);
    setMessage("会員情報を保存しました。");
    if (isApproved) {
      router.push(`/members/${user.id}`);
    }
  }

  function field(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main>
      <PageHero eyebrow="Edit Profile" title="プロフィール編集" description="あなたの経験や相談できることを登録し、青年部内のつながりを広げましょう。" />
      <section className="page-content">
        <div className="container">
          <BackLink href={user && isApproved ? `/members/${user.id}` : "/auth"} />
          <div className="form-card">
            <ApprovalGate action="プロフィール編集" allowPending>
              <form onSubmit={submit}>
                {error && <p className="error">{error}</p>}
                {message && <p className="notice">{message}</p>}
                <p className="draft-note">入力内容はこの端末に一時保存されます。画像は再選択が必要です。</p>
                {isEditingElsewhere && (
                  <p className="pending-banner">
                    別のウインドウでもプロフィールを編集中です。このウインドウの入力内容は個別に一時保存されます。
                  </p>
                )}
                {!isApproved && (
                  <p className="pending-banner">
                    管理者承認前でも会員情報を修正できます。保存後も承認状態は変わりません。
                  </p>
                )}
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
                  <label htmlFor="qualifications">保有資格</label>
                  <textarea id="qualifications" value={form.qualifications} onChange={(e) => field("qualifications", e.target.value)} placeholder="FP、宅建士、建築士 など。複数ある場合は「、」や改行で区切ってください。" />
                </div>
                <div className="field">
                  <label htmlFor="specialties">得意分野</label>
                  <textarea id="specialties" value={form.specialties} onChange={(e) => field("specialties", e.target.value)} placeholder="SNS運用、補助金申請、動画制作 など。複数登録できます。" />
                </div>
                <div className="field">
                  <label htmlFor="available_work">対応可能業務</label>
                  <textarea id="available_work" value={form.available_work} onChange={(e) => field("available_work", e.target.value)} placeholder="ホームページ制作、店舗設計、広告デザイン など" />
                </div>
                <div className="field">
                  <label htmlFor="service_areas">対応エリア</label>
                  <textarea id="service_areas" value={form.service_areas} onChange={(e) => field("service_areas", e.target.value)} placeholder="奈良県全域、奈良市、橿原市 など" />
                </div>
                <div className="field">
                  <label htmlFor="experience_years">経験年数</label>
                  <select id="experience_years" value={form.experience_years} onChange={(e) => field("experience_years", e.target.value)}>
                    <option value="">未設定</option>
                    <option value="1年未満">1年未満</option>
                    <option value="1〜3年">1〜3年</option>
                    <option value="3〜5年">3〜5年</option>
                    <option value="5〜10年">5〜10年</option>
                    <option value="10年以上">10年以上</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="website_url">WebサイトURL</label>
                  <input
                    id="website_url"
                    inputMode="url"
                    placeholder="https://example.com"
                    type="url"
                    value={form.website_url}
                    onChange={(e) => field("website_url", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="homepage_url">ホームページURL</label>
                  <input id="homepage_url" inputMode="url" placeholder="https://example.com" type="url" value={form.homepage_url} onChange={(e) => field("homepage_url", e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="portfolio_url">ポートフォリオURL</label>
                  <input id="portfolio_url" inputMode="url" placeholder="https://example.com/works" type="url" value={form.portfolio_url} onChange={(e) => field("portfolio_url", e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="instagram_url">Instagram</label>
                  <input id="instagram_url" inputMode="url" placeholder="https://www.instagram.com/..." type="url" value={form.instagram_url} onChange={(e) => field("instagram_url", e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="facebook_url">Facebook</label>
                  <input id="facebook_url" inputMode="url" placeholder="https://www.facebook.com/..." type="url" value={form.facebook_url} onChange={(e) => field("facebook_url", e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="x_url">X</label>
                  <input id="x_url" inputMode="url" placeholder="https://x.com/..." type="url" value={form.x_url} onChange={(e) => field("x_url", e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="other_sns_url">その他SNS</label>
                  <input id="other_sns_url" inputMode="url" placeholder="https://..." type="url" value={form.other_sns_url} onChange={(e) => field("other_sns_url", e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="sns_url">SNSリンク先URL</label>
                  <input
                    id="sns_url"
                    inputMode="url"
                    placeholder="https://www.instagram.com/..."
                    type="url"
                    value={form.sns_url}
                    onChange={(e) => field("sns_url", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>プロフィール画像</label>
                  <ImageCropper
                    currentImageUrl={profile?.avatar_url}
                    onChange={setImage}
                    onProcessingChange={setImageProcessing}
                    outputWidth={800}
                    outputHeight={800}
                    imageLabel="プロフィール画像"
                  />
                </div>
                <div className="field">
                  <label htmlFor="line_notify_target">LINE通知先（将来連携用）</label>
                  <input id="line_notify_target" value={form.line_notify_target} onChange={(e) => field("line_notify_target", e.target.value)} placeholder="LINE User IDなど" />
                </div>
                <label className="check-field">
                  <input type="checkbox" checked={lineEnabled} onChange={(e) => setLineEnabled(e.target.checked)} />
                  LINE通知を有効にする（API接続後に配信）
                </label>
                <button className="button" type="submit" disabled={saving || imageProcessing}>
                  {saving ? "保存中..." : imageProcessing ? "画像を反映中..." : "プロフィールを保存"}
                </button>
              </form>
            </ApprovalGate>
          </div>
        </div>
      </section>
    </main>
  );
}

function splitTags(value: string) {
  return value
    .split(/[\n,、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
