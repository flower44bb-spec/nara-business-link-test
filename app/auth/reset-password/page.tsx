"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { HomeLink } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmation) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("パスワードを更新できませんでした。再設定メールからもう一度お試しください。");
    } else {
      setMessage("パスワードを更新しました。新しいパスワードでログインできます。");
      await supabase.auth.signOut();
    }
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <HomeLink />
        <h1>新しいパスワードを設定</h1>
        <p>8文字以上の新しいパスワードを入力してください。</p>
        {error && <p className="error">{error}</p>}
        {message && <p className="notice">{message}</p>}
        {!message && (
          ready ? (
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="new-password">新しいパスワード</label>
                <input
                  id="new-password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="confirm-password">新しいパスワード（確認）</label>
                <input
                  id="confirm-password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                />
              </div>
              <button className="button" type="submit" disabled={loading}>
                {loading ? "更新中..." : "パスワードを更新"}
              </button>
            </form>
          ) : (
            <p className="error">再設定リンクが無効または期限切れです。再設定メールをもう一度送信してください。</p>
          )
        )}
        <Link className="auth-help-link" href="/auth">ログイン画面へ戻る</Link>
      </section>
    </main>
  );
}
