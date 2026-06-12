"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Safari may visually autofill inputs without firing React's change event.
    // Read the submitted DOM values so password-manager entries are always used.
    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get("email") ?? email);
    const submittedPassword = String(formData.get("password") ?? password);
    const submittedName = String(formData.get("name") ?? name);

    if (mode === "login") {
      const normalizedEmail = submittedEmail.trim().toLocaleLowerCase("en-US");
      setEmail(normalizedEmail);
      setPassword(submittedPassword);
      try {
        const result = await withTimeout(
          supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: submittedPassword,
          }),
          20000,
        );
        if (result.error) {
          setError(authErrorMessage(result.error.message));
        } else if (!result.data.session) {
          setError("ログイン情報を保存できませんでした。ブラウザのプライベートモードを解除して、もう一度お試しください。");
        } else {
          setMessage("ログインしました。トップページへ移動します。");
          router.replace("/");
          router.refresh();
        }
      } catch {
        setError("通信に時間がかかっています。電波状況を確認し、Wi-Fiとモバイル通信を切り替えて再度お試しください。");
      }
    } else {
      const normalizedEmail = submittedEmail.trim().toLocaleLowerCase("en-US");
      setEmail(normalizedEmail);
      setPassword(submittedPassword);
      setName(submittedName);
      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: submittedPassword,
        options: { data: { name: submittedName } },
      });
      if (authError) setError(authErrorMessage(authError.message));
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
            <Link className="button" href="/members/me/edit">
              <Pencil size={16} /> 会員情報を編集
            </Link>
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
                  <input
                    autoComplete="name"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="field">
                <label htmlFor="email">メールアドレス</label>
                <input
                  autoCapitalize="none"
                  autoComplete="email"
                  id="email"
                  inputMode="email"
                  name="email"
                  spellCheck={false}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="password">パスワード</label>
                <div className="password-field">
                  <input
                    autoCapitalize="none"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    id="password"
                    minLength={6}
                    name="password"
                    spellCheck={false}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                    className="password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
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

function authErrorMessage(message: string) {
  const normalized = message.toLocaleLowerCase("en-US");
  if (normalized.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。入力内容をご確認ください。";
  }
  if (normalized.includes("email not confirmed")) {
    return "メールアドレスの確認が完了していません。確認メールをご確認ください。";
  }
  if (normalized.includes("user already registered")) {
    return "このメールアドレスはすでに登録されています。ログインをお試しください。";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "試行回数が多いため一時的に制限されています。しばらく時間をおいてお試しください。";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "通信できませんでした。電波状況を確認して、もう一度お試しください。";
  }
  return `ログイン処理に失敗しました: ${message}`;
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("timeout")), timeoutMs);
    }),
  ]);
}
