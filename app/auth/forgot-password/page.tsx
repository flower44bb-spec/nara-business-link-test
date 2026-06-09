"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { HomeLink } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const RETRY_AT_KEY = "password-reset-retry-at";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const savedRetryAt = Number(window.localStorage.getItem(RETRY_AT_KEY) || 0);
    if (savedRetryAt > Date.now()) {
      setRetryAt(savedRetryAt);
    } else {
      window.localStorage.removeItem(RETRY_AT_KEY);
    }
  }, []);

  useEffect(() => {
    if (retryAt <= now) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt, now]);

  const remainingMinutes = Math.max(0, Math.ceil((retryAt - now) / 60000));

  function startCooldown(minutes: number) {
    const nextRetryAt = Date.now() + minutes * 60 * 1000;
    window.localStorage.setItem(RETRY_AT_KEY, String(nextRetryAt));
    setRetryAt(nextRetryAt);
    setNow(Date.now());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (retryAt > Date.now()) return;

    setLoading(true);
    setError("");
    setMessage("");

    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (resetError) {
      if (resetError.status === 429) {
        startCooldown(60);
        setError(
          "メール送信上限（1時間に2通）に達しました。約1時間後に一度だけ再送してください。",
        );
      } else {
        setError(
          "再設定メールを送信できませんでした。入力内容を確認し、時間をおいて再度お試しください。",
        );
      }
    } else {
      startCooldown(5);
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
        <div className="auth-support-box">
          <strong>メールが届かない場合</strong>
          <p>
            迷惑メールフォルダをご確認ください。送信上限はサイト全体で1時間に2通です。
            繰り返し押さず、上限エラー時は約1時間後に一度だけお試しください。
          </p>
        </div>
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
          <button
            className="button"
            type="submit"
            disabled={loading || remainingMinutes > 0}
          >
            {loading
              ? "送信中..."
              : remainingMinutes > 0
                ? `再送まで約${remainingMinutes}分`
                : "再設定メールを送る"}
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
