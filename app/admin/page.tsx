"use client";

import { Check, RefreshCw, Shield, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ApprovalGate } from "@/components/approval-gate";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { recordTitle } from "@/lib/records";
import { supabase } from "@/lib/supabase";
import type { BaseRecord, MarchePost, Profile } from "@/types";

const contentTables = [
  { table: "businesses", label: "事業者" },
  { table: "problems", label: "困りごと" },
  { table: "collaborations", label: "コラボ募集" },
  { table: "successes", label: "成功事例" },
  { table: "marche_posts", label: "マルシェ" },
] as const;

type PendingContent = BaseRecord & {
  sourceTable: string;
  sourceLabel: string;
  author?: Profile;
};

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<PendingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const [profileResult, ...postResults] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      ...contentTables.map(({ table }) =>
        supabase.from(table).select("*").order("created_at", { ascending: false }),
      ),
    ]);
    if (profileResult.error) setError(profileResult.error.message);
    const loadedUsers = (profileResult.data as Profile[]) ?? [];
    const profileMap = new Map(loadedUsers.map((profile) => [profile.id, profile]));
    setUsers(loadedUsers);
    const combined: PendingContent[] = [];
    postResults.forEach((result, index) => {
      if (result.error) return;
      for (const item of (result.data as BaseRecord[]) ?? []) {
        combined.push({
          ...item,
          sourceTable: contentTables[index].table,
          sourceLabel: contentTables[index].label,
          author: item.user_id ? profileMap.get(item.user_id) : undefined,
        });
      }
    });
    setPosts(combined);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateUser(profile: Profile, approve: boolean) {
    setMessage("");
    setError("");
    const { error: updateError } = await supabase.from("profiles").update(
      approve
        ? { role: "member", rejected_at: null, updated_at: new Date().toISOString() }
        : { role: "pending", rejected_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ).eq("id", profile.id);
    if (updateError) setError(updateError.message);
    else {
      setMessage(`${profile.full_name || profile.email || "ユーザー"}を${approve ? "承認" : "却下"}しました。`);
      await load();
    }
  }

  async function deleteUser(profile: Profile) {
    const displayName = profile.full_name || profile.email || "この会員";
    const confirmed = window.confirm(
      `${displayName}の会員アカウントを削除します。\nログイン情報・プロフィール・投稿・DMなども削除され、元に戻せません。よろしいですか？`,
    );
    if (!confirmed) return;

    setMessage("");
    setError("");
    const { error: deleteError } = await supabase.rpc("admin_delete_user", {
      target_user_id: profile.id,
    });
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage(`${displayName}の会員アカウントを削除しました。`);
    await load();
  }

  async function updatePost(post: PendingContent, action: "approve" | "reject" | "delete") {
    setMessage("");
    setError("");
    if (action === "delete" && !window.confirm("この投稿を削除します。よろしいですか？")) return;
    const { error: updateError } = action === "delete"
      ? await supabase.from(post.sourceTable).delete().eq("id", post.id)
      : await supabase.rpc("admin_set_content_status", {
          target_table: post.sourceTable,
          target_id: post.id,
          next_status: action === "approve" ? "approved" : "rejected",
        });
    if (updateError) setError(updateError.message);
    else {
      setMessage(`「${postTitle(post)}」を${action === "approve" ? "承認" : action === "reject" ? "却下" : "削除"}しました。`);
      await load();
    }
  }

  return (
    <main>
      <PageHero eyebrow="Administration" title="管理者ページ" description="会員登録と各投稿の承認状況を確認し、公開範囲を管理します。" />
      <section className="page-content">
        <div className="container">
          <HomeLink />
          <ApprovalGate adminOnly action="管理者ページ">
            <div className="admin-toolbar">
              <div><Shield /><strong>承認管理</strong></div>
              <button className="button secondary" type="button" onClick={load}><RefreshCw size={16} /> 再読み込み</button>
            </div>
            {message && <p className="notice">{message}</p>}
            {error && <p className="error">{error}</p>}
            {loading ? <Loading /> : (
              <div className="admin-sections">
                <section className="admin-panel">
                  <h2>未承認ユーザー <span>{users.filter((user) => user.role === "pending" && !user.rejected_at).length}</span></h2>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>氏名</th><th>メール</th><th>所属・会社</th><th>状態</th><th>操作</th></tr></thead>
                      <tbody>
                        {users.filter((profile) => profile.role === "pending").length ? users.filter((profile) => profile.role === "pending").map((profile) => (
                          <tr key={profile.id}>
                            <td>{profile.full_name || "未設定"}</td>
                            <td>{profile.email}</td>
                            <td>{profile.local_chapter || "-"} / {profile.company_name || "-"}</td>
                            <td><span className={profile.rejected_at ? "status rejected" : "status pending"}>{profile.rejected_at ? "却下済み" : "承認待ち"}</span></td>
                            <td className="action-cell">
                              <button className="icon-action approve" type="button" onClick={() => updateUser(profile, true)}><Check size={16} /> 承認</button>
                              {!profile.rejected_at && <button className="icon-action reject" type="button" onClick={() => updateUser(profile, false)}><X size={16} /> 却下</button>}
                            </td>
                          </tr>
                        )) : <tr><td colSpan={5}>未承認ユーザーはいません。</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="admin-panel">
                  <h2>会員アカウント照会 <span>{users.length}</span></h2>
                  <p>ログイン用メールアドレスを忘れた会員について、本人確認後に氏名・所属・会社名から照会してください。</p>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>氏名</th><th>メール</th><th>所属・会社</th><th>権限</th><th>操作</th></tr></thead>
                      <tbody>
                        {users.length ? users.map((profile) => (
                          <tr key={`account-${profile.id}`}>
                            <td>{profile.full_name || "未設定"}</td>
                            <td>{profile.email || "未設定"}</td>
                            <td>{profile.local_chapter || "-"} / {profile.company_name || "-"}</td>
                            <td><span className={`status ${profile.role}`}>{profile.role === "admin" ? "管理者" : profile.role === "member" ? "承認済み" : "承認待ち"}</span></td>
                            <td className="action-cell">
                              {profile.id === user?.id ? (
                                <span className="admin-self-label">ログイン中</span>
                              ) : (
                                <button className="icon-action delete" type="button" onClick={() => deleteUser(profile)}>
                                  <Trash2 size={16} /> 会員削除
                                </button>
                              )}
                            </td>
                          </tr>
                        )) : <tr><td colSpan={5}>会員情報がありません。</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="admin-panel admin-post-management">
                  <h2>
                    投稿管理
                    <span>{posts.filter((post) => post.approval_status === "pending").length}</span>
                  </h2>
                  <p className="admin-panel-help">
                    投稿種別を選ぶと、承認状況と投稿者情報を確認できます。
                  </p>
                  <div className="admin-post-groups">
                    {contentTables.map(({ table, label }) => {
                      const tablePosts = posts.filter((post) => post.sourceTable === table);
                      const pendingCount = tablePosts.filter(
                        (post) => post.approval_status === "pending",
                      ).length;

                      return (
                        <details className="admin-post-group" open={pendingCount > 0 || undefined} key={table}>
                          <summary>
                            <span>{label}</span>
                            <span className="admin-summary-meta">
                              {pendingCount > 0 && (
                                <span className="pending-count">{pendingCount}件 承認待ち</span>
                              )}
                              <span className="total-count">全{tablePosts.length}件</span>
                            </span>
                          </summary>
                          <div className="admin-table-wrap">
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>タイトル</th>
                                  <th>氏名</th>
                                  <th>所属・会社</th>
                                  <th>状態</th>
                                  <th>投稿日</th>
                                  <th>操作</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tablePosts.length ? tablePosts.map((post) => (
                                  <tr key={`${post.sourceTable}-${post.id}`}>
                                    <td>{postTitle(post)}</td>
                                    <td>{post.author?.full_name || "未設定"}</td>
                                    <td>{post.author?.local_chapter || "-"} / {post.author?.company_name || "-"}</td>
                                    <td>
                                      <span className={`status ${post.approval_status}`}>
                                        {post.approval_status === "approved"
                                          ? "公開中"
                                          : post.approval_status === "rejected"
                                            ? "却下"
                                            : "承認待ち"}
                                      </span>
                                    </td>
                                    <td>{post.created_at ? new Date(post.created_at).toLocaleDateString("ja-JP") : "-"}</td>
                                    <td className="action-cell">
                                      {post.approval_status !== "approved" && (
                                        <button className="icon-action approve" type="button" onClick={() => updatePost(post, "approve")}>
                                          <Check size={16} /> 承認
                                        </button>
                                      )}
                                      {post.approval_status !== "rejected" && (
                                        <button className="icon-action reject" type="button" onClick={() => updatePost(post, "reject")}>
                                          <X size={16} /> 却下
                                        </button>
                                      )}
                                      <button className="icon-action delete" type="button" onClick={() => updatePost(post, "delete")}>
                                        <Trash2 size={16} /> 削除
                                      </button>
                                    </td>
                                  </tr>
                                )) : (
                                  <tr><td colSpan={6}>{label}の投稿はありません。</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </ApprovalGate>
        </div>
      </section>
    </main>
  );
}

function postTitle(post: PendingContent) {
  if (post.sourceTable === "marche_posts") {
    return String((post as unknown as MarchePost).event_name || "名称未設定");
  }
  return recordTitle(post);
}
