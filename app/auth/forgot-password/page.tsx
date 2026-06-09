"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { HomeLink } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (resetError) {
      setError("再設定メールを送信できませんでした。時間をおいて再度お試しください。");
    } else {
      setMessage("登録されている場合、パスワード再設定メールを送信しました。迷惑メールフォルダもご確認ください。");
    }
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <HomeLink />
        <h1>ログイン情報の確認</h1>
        <p>登録メールアドレスへ、パスワード再設定用のリンクを送信します。</p>
        {error && <p className="error">{error}</p>}
        {message && <p className="notice">{message}</p>}
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="reset-email">登録メールアドレス</label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "送信中..." : "再設定メールを送る"}
          </button>
        </form>
        <div className="auth-support-box">
          <strong>メールアドレスも分からない場合</strong>
          <p>管理者へ氏名・所属単会・会社名を伝え、本人確認後に登録メールアドレスを照会してください。</p>
        </div>
        <Link className="auth-help-link" href="/auth">ログイン画面へ戻る</Link>
      </section>
    </main>
  );
}
