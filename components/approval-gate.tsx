"use client";

import { Clock3, LogIn, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Loading } from "./ui";

export function ApprovalGate({
  children,
  action = "この操作",
  adminOnly = false,
  allowPending = false,
}: {
  children: React.ReactNode;
  action?: string;
  adminOnly?: boolean;
  allowPending?: boolean;
}) {
  const router = useRouter();
  const { user, profile, isApproved, isAdmin, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) {
    return (
      <div className="gate-card">
        <LogIn size={32} />
        <h3>ログインが必要です</h3>
        <p>{action}には会員ログインが必要です。</p>
        <button className="button" type="button" onClick={() => router.push("/auth")}>
          ログインへ
        </button>
      </div>
    );
  }
  if (adminOnly && !isAdmin) {
    return (
      <div className="gate-card">
        <ShieldCheck size={32} />
        <h3>アクセスできません</h3>
        <p>このページは管理者専用です。</p>
      </div>
    );
  }
  if (!adminOnly && !allowPending && !isApproved) {
    return (
      <div className="gate-card">
        <Clock3 size={32} />
        <h3>{profile?.rejected_at ? "会員申請は承認されませんでした" : "管理者承認待ちです"}</h3>
        <p>
          {profile?.rejected_at
            ? "詳しくは青年部事務局へお問い合わせください。"
            : `${profile?.full_name || user.email}さんの登録を確認しています。承認後に${action}をご利用いただけます。`}
        </p>
      </div>
    );
  }
  return children;
}
