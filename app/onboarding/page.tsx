"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, LogIn } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { insertRecord, updateRecord } from "@/lib/mutations";
import { isOnboardingComplete } from "@/lib/onboarding";
import { supabase } from "@/lib/supabase";
import { useFormDraft } from "@/lib/use-form-draft";
import type { BaseRecord } from "@/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, isAdmin, loading: authLoading, refreshProfile } = useAuth();
  const [business, setBusiness] = useState<BaseRecord | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    local_chapter: "",
    industry: "",
    services: "",
    bio: "",
  });
  const [profileApplied, setProfileApplied] = useState(false);

  const { clearDraft, hasDraft, restored } = useFormDraft({
    key: `draft:onboarding:${user?.id || "guest"}`,
    value: form,
    enabled: Boolean(user),
    onRestore: (saved) => setForm(saved),
  });

  useEffect(() => {
    if (!user) {
      setBusiness(null);
      setLoadingBusiness(false);
      return;
    }

    setLoadingBusiness(true);
    supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const businesses = (data as BaseRecord[]) ?? [];
        setBusiness(businesses.find((item) => String(item.services || "").trim()) ?? businesses[0] ?? null);
        setLoadingBusiness(false);
      });
  }, [user]);

  useEffect(() => {
    if (!restored || profileApplied || hasDraft || !profile) return;
    setForm((current) => ({
      full_name: profile.full_name || current.full_name,
      company_name: profile.company_name || current.company_name,
      local_chapter: profile.local_chapter || current.local_chapter,
      industry: profile.industry || current.industry,
      services: String(business?.services || current.services),
      bio: profile.bio || current.bio,
    }));
    setProfileApplied(true);
  }, [business, hasDraft, profile, profileApplied, restored]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setMessage("");

    const trimmed = {
      full_name: form.full_name.trim(),
      company_name: form.company_name.trim(),
      local_chapter: form.local_chapter.trim(),
      industry: form.industry.trim(),
      services: form.services.trim(),
      bio: form.bio.trim(),
    };

    if (Object.values(trimmed).some((value) => !value)) {
      setError("必須項目をすべて入力してください。");
      setSaving(false);
      return;
    }

    const profilePayload = {
      full_name: trimmed.full_name,
      company_name: trimmed.company_name,
      local_chapter: trimmed.local_chapter,
      industry: trimmed.industry,
      bio: trimmed.bio,
      updated_at: new Date().toISOString(),
    };

    const profileResult = profile
      ? await supabase.from("profiles").update(profilePayload).eq("id", user.id).select("id").single()
      : await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          role: "member",
          ...profilePayload,
        }).select("id").single();

    if (profileResult.error) {
      setError(`会員プロフィールを保存できませんでした: ${profileResult.error.message}`);
      setSaving(false);
      return;
    }

    const businessPayload = {
      name: trimmed.company_name,
      title: trimmed.company_name,
      category: trimmed.industry,
      area: trimmed.local_chapter,
      description: trimmed.bio,
      detail: trimmed.bio,
      content: trimmed.bio,
      services: trimmed.services,
      user_id: user.id,
      approval_status: isAdmin ? business?.approval_status || "approved" : "pending",
      updated_at: new Date().toISOString(),
    };

    const businessResult = business
      ? await updateRecord("businesses", String(business.id), businessPayload)
      : await insertRecord("businesses", businessPayload);

    if (businessResult.error) {
      setError(`事業者情報を保存できませんでした: ${businessResult.error.message}`);
      setSaving(false);
      return;
    }

    clearDraft();
    await refreshProfile();
    setBusiness(businessResult.data as BaseRecord);
    setSaving(false);
    setMessage("初回設定を保存しました。サイトをご利用いただけます。");
    router.push("/");
    router.refresh();
  }

  function field(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const complete = isOnboardingComplete(profile, business);

  return (
    <main>
      <PageHero
        eyebrow="First Setup"
        title="初回設定"
        description="会員プロフィールと事業者情報を最低限登録して、青年部内で相談・取引につながる状態にします。"
      />
      <section className="page-content">
        <div className="container">
          <HomeLink />
          <div className="form-card">
            {authLoading || loadingBusiness ? (
              <Loading />
            ) : !user ? (
              <div className="gate-card">
                <LogIn size={32} />
                <h3>ログインが必要です</h3>
                <p>初回設定には会員ログインが必要です。</p>
                <button className="button" type="button" onClick={() => router.push("/auth")}>ログインへ</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="onboarding-heading">
                  <Building2 size={32} />
                  <div>
                    <h2>まずはこの6項目だけ入力してください</h2>
                    <p>あとから詳細編集できます。ここでは検索や相談開始に必要な最低限の情報だけ登録します。</p>
                  </div>
                </div>
                {complete && (
                  <p className="notice"><CheckCircle2 size={16} /> 最低限の登録は完了しています。内容を更新する場合は保存してください。</p>
                )}
                {error && <p className="error">{error}</p>}
                {message && <p className="notice">{message}</p>}
                <p className="draft-note">入力内容はこの端末に一時保存されます。</p>
                <div className="field">
                  <label htmlFor="full_name">名前 *</label>
                  <input id="full_name" value={form.full_name} onChange={(event) => field("full_name", event.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="company_name">会社名 *</label>
                  <input id="company_name" value={form.company_name} onChange={(event) => field("company_name", event.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="local_chapter">単会名 *</label>
                  <input id="local_chapter" placeholder="例：奈良市商工会青年部" value={form.local_chapter} onChange={(event) => field("local_chapter", event.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="industry">業種 *</label>
                  <input id="industry" placeholder="例：建設業、飲食業、士業、IT・Web" value={form.industry} onChange={(event) => field("industry", event.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="services">商品・サービス *</label>
                  <textarea id="services" placeholder="例：住宅リフォーム、補助金申請支援、店舗メニュー開発など" value={form.services} onChange={(event) => field("services", event.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="bio">自己紹介 *</label>
                  <textarea id="bio" placeholder="事業内容、得意なこと、相談してほしいことなどを入力してください。" value={form.bio} onChange={(event) => field("bio", event.target.value)} required />
                </div>
                <div className="form-actions">
                  <button className="button" type="submit" disabled={saving}>
                    {saving ? "保存中..." : "初回設定を保存"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
