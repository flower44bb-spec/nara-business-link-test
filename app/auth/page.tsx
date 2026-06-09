"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { HomeLink } from "@/components/ui";

export default function AuthPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "login") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) setError(authError.message);
      else router.push("/");
    } else {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (authError) setError(authError.message);
      else if (data.session) router.push("/");
      else setMessage("確認メールを送信しました。登録完了後は管理者の承認をお待ちください。");
    }
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <HomeLink />
        <h1>{user ? "ログイン中です" : "会員メニュー"}</h1>
        <p>奈良県商工会青年部員のアカウントでご利用ください。</p>
        {user ? (
          <>
            <div className="notice">{user.email}</div>
            {profile?.role === "pending" && (
              <div className="pending-banner">管理者承認待ちです</div>
            )}
            <button className="button secondary" type="button" onClick={logout}>
              ログアウト
            </button>
          </>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={mode === "login" ? "active" : ""}
                type="button"
                onClick={() => setMode("login")}
              >
                ログイン
              </button>
              <button
                className={mode === "signup" ? "active" : ""}
                type="button"
                onClick={() => setMode("signup")}
              >
                会員登録
              </button>
            </div>
            {error && <p className="error">{error}</p>}
            {message && <p className="notice">{message}</p>}
            <form onSubmit={submit}>
              {mode === "signup" && (
                <div className="field">
                  <label htmlFor="name">お名前</label>
                  <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className="field">
                <label htmlFor="email">メールアドレス</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="password">パスワード</label>
                <input id="password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button className="button" type="submit" disabled={loading}>
                {loading ? "送信中..." : mode === "login" ? "ログイン" : "会員登録"}
              </button>
              {mode === "login" && (
                <Link className="auth-help-link" href="/auth/forgot-password">
                  メールアドレス・パスワードを忘れた方
                </Link>
              )}
            </form>
          </>
        )}
      </section>
    </main>
  );
}
