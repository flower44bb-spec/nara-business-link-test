"use client";

import { Check, Download, Eye, RefreshCw, Shield, Star, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApprovalGate } from "@/components/approval-gate";
import { Pagination, paginate } from "@/components/pagination";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { recordTitle } from "@/lib/records";
import { supabase } from "@/lib/supabase";
import { dealStatusLabels, formatDealAmount } from "@/lib/deals";
import type { BaseRecord, BusinessDeal, LoginEvent, MarchePost, Profile } from "@/types";
import { AdminAnalytics } from "@/components/admin-analytics";

const contentTables = [
  { table: "businesses", label: "事業者" },
  { table: "problems", label: "困りごと" },
  { table: "collaborations", label: "コラボ募集" },
  { table: "successes", label: "成功事例" },
  { table: "marche_posts", label: "イベント" },
] as const;

type PendingContent = BaseRecord & {
  sourceTable: string;
  sourceLabel: string;
  author?: Profile;
};

type RankingItem = { name: string; count: number };
type SkillRankings = {
  qualifications?: RankingItem[];
  specialties?: RankingItem[];
  searches?: RankingItem[];
  consultations?: RankingItem[];
};

const ADMIN_PAGE_SIZE = 10;

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<PendingContent[]>([]);
  const [deals, setDeals] = useState<BusinessDeal[]>([]);
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);
  const [skillRankings, setSkillRankings] = useState<SkillRankings>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [accountPage, setAccountPage] = useState(1);

  const pendingUsers = users.filter((profile) => profile.role === "pending");
  const activePendingCount = pendingUsers.filter((profile) => !profile.rejected_at).length;
  const pendingTotalPages = Math.max(1, Math.ceil(pendingUsers.length / ADMIN_PAGE_SIZE));
  const accountTotalPages = Math.max(1, Math.ceil(users.length / ADMIN_PAGE_SIZE));
  const visiblePendingUsers = paginate(pendingUsers, pendingPage, ADMIN_PAGE_SIZE);
  const visibleAccountUsers = paginate(users, accountPage, ADMIN_PAGE_SIZE);

  async function load() {
    setLoading(true);
    setError("");
    const [profileResult, dealResult, loginResult, rankingResult, ...postResults] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      supabase.from("business_deals").select("*").order("updated_at", { ascending: false }),
      supabase.from("login_events").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.rpc("admin_skill_rankings"),
      ...contentTables.map(({ table }) =>
        supabase.from(table).select("*").order("created_at", { ascending: false }),
      ),
    ]);
    if (profileResult.error) {
      console.error("Failed to load admin profiles:", profileResult.error);
      setError("会員情報を読み込めませんでした。時間をおいて再度お試しください。");
    }
    const loadedUsers = (profileResult.data as Profile[]) ?? [];
    const profileMap = new Map(loadedUsers.map((profile) => [profile.id, profile]));
    setUsers(loadedUsers);
    setDeals((dealResult.data as BusinessDeal[]) ?? []);
    setLoginEvents((loginResult.data as LoginEvent[]) ?? []);
    if (!rankingResult.error) setSkillRankings((rankingResult.data as SkillRankings) ?? {});
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
  useEffect(() => {
    setPendingPage((page) => Math.min(page, pendingTotalPages));
  }, [pendingTotalPages]);
  useEffect(() => {
    setAccountPage((page) => Math.min(page, accountTotalPages));
  }, [accountTotalPages]);

  async function updateUser(profile: Profile, approve: boolean) {
    setMessage("");
    setError("");
    const { error: updateError } = await supabase.from("profiles").update(
      approve
        ? { role: "member", rejected_at: null, updated_at: new Date().toISOString() }
        : { role: "pending", rejected_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ).eq("id", profile.id);
    if (updateError) {
      console.error("Failed to update member approval:", updateError);
      setError("会員の承認状態を更新できませんでした。時間をおいて再度お試しください。");
    }
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
      console.error("Failed to delete member:", deleteError);
      setError("会員アカウントを削除できませんでした。権限とデータベース設定を確認してください。");
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
    if (updateError) {
      console.error("Failed to update post status:", updateError);
      setError("投稿の状態を更新できませんでした。時間をおいて再度お試しください。");
    }
    else {
      setMessage(`「${postTitle(post)}」を${action === "approve" ? "承認" : action === "reject" ? "却下" : "削除"}しました。`);
      await load();
    }
  }

  async function toggleFeatured(post: PendingContent) {
    setMessage("");
    setError("");
    const nextFeatured = !post.is_featured;
    const { error: updateError } = await supabase.rpc("admin_set_featured_status", {
      target_table: post.sourceTable,
      target_id: post.id,
      next_featured: nextFeatured,
    });

    if (updateError) {
      console.error("Failed to update featured status:", updateError);
      setError("優先表示を更新できませんでした。Supabaseで最新の優先表示用SQLが実行済みか確認してください。");
      return;
    }

    setMessage(`「${postTitle(post)}」を${nextFeatured ? "優先表示に設定" : "優先表示から解除"}しました。`);
    await load();
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
                <AdminAnalytics />
                <section className="admin-panel">
                  <h2>ログイン履歴 <span>{loginEvents.length}</span></h2>
                  <p className="admin-panel-help">直近100件のログイン成功履歴です。誰がいつログインしたかを確認できます。</p>
                  <button className="icon-action" type="button" onClick={() => exportLoginEventsCsv(loginEvents, users)}>
                    <Download size={16} /> ログイン履歴CSV出力
                  </button>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>ログイン日時</th><th>氏名</th><th>メール</th><th>所属・会社</th><th>利用環境</th></tr></thead>
                      <tbody>
                        {loginEvents.length ? loginEvents.map((event) => {
                          const profile = event.user_id ? users.find((item) => item.id === event.user_id) : undefined;
                          return (
                            <tr key={event.id}>
                              <td>{new Date(event.created_at).toLocaleString("ja-JP")}</td>
                              <td>{profile?.full_name || "未設定"}</td>
                              <td>{event.email || profile?.email || "未設定"}</td>
                              <td>{profile?.local_chapter || "-"} / {profile?.company_name || "-"}</td>
                              <td>{shortUserAgent(event.user_agent)}</td>
                            </tr>
                          );
                        }) : <tr><td colSpan={5}>ログイン履歴はまだありません。Supabaseでログイン履歴SQLが実行済みか確認してください。</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="admin-panel">
                  <h2>商談管理 <span>{deals.length}</span></h2>
                  <p className="admin-panel-help">投稿やDMから始まった商談の進捗、金額、成功事例への変換状況を確認できます。</p>
                  <button className="icon-action" type="button" onClick={() => exportDealsCsv(deals, users)}>
                    <Download size={16} /> 商談CSV出力
                  </button>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead><tr><th>商談名</th><th>状態</th><th>依頼者</th><th>受注者</th><th>金額</th><th>成功事例</th><th>操作</th></tr></thead>
                      <tbody>
                        {deals.length ? deals.map((deal) => {
                          const requester = users.find((profile) => profile.id === deal.requester_id);
                          const contractor = users.find((profile) => profile.id === deal.contractor_id);
                          return (
                            <tr key={deal.id}>
                              <td>{deal.title}</td>
                              <td><span className={`status ${deal.status}`}>{dealStatusLabels[deal.status]}</span></td>
                              <td>{requester?.full_name || requester?.company_name || "未設定"}</td>
                              <td>{contractor?.full_name || contractor?.company_name || "未設定"}</td>
                              <td>{formatDealAmount(deal.amount)}</td>
                              <td>{deal.success_id ? <Link className="text-link" href={`/successes/${deal.success_id}`}>登録済み</Link> : "未登録"}</td>
                              <td><Link className="icon-action" href={`/deals/${deal.id}`}><Eye size={16} /> 詳細</Link></td>
                            </tr>
                          );
                        }) : <tr><td colSpan={7}>商談はまだありません。</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="admin-panel">
                  <h2>スキル分析</h2>
                  <p className="admin-panel-help">会員の資格・得意分野・検索回数・相談件数をランキングで確認できます。</p>
                  <button className="icon-action" type="button" onClick={() => exportSkillsCsv(skillRankings)}>
                    <Download size={16} /> スキルCSV出力
                  </button>
                  <div className="ranking-grid">
                    <RankingBox title="資格一覧" items={skillRankings.qualifications || []} />
                    <RankingBox title="得意分野一覧" items={skillRankings.specialties || []} />
                    <RankingBox title="検索回数ランキング" items={skillRankings.searches || []} />
                    <RankingBox title="相談件数ランキング" items={skillRankings.consultations || []} />
                  </div>
                </section>

                <section className="admin-panel">
                  <div className="admin-post-groups">
                    <details className="admin-post-group" open={activePendingCount > 0 || undefined}>
                      <summary>
                        <span>未承認ユーザー</span>
                        <span className="admin-summary-meta">
                          {activePendingCount > 0 && <span className="pending-count">{activePendingCount}件 承認待ち</span>}
                          <span className="total-count">全{pendingUsers.length}件</span>
                        </span>
                      </summary>
                      <p className="admin-list-range">{itemRange(pendingUsers.length, pendingPage)}</p>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead><tr><th>氏名</th><th>メール</th><th>所属・会社</th><th>状態</th><th>操作</th></tr></thead>
                          <tbody>
                            {visiblePendingUsers.length ? visiblePendingUsers.map((profile) => (
                              <tr key={profile.id}>
                                <td>{profile.full_name || "未設定"}</td>
                                <td>{profile.email || "未設定"}</td>
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
                      <Pagination
                        currentPage={pendingPage}
                        onPageChange={setPendingPage}
                        pageSize={ADMIN_PAGE_SIZE}
                        scrollToTop={false}
                        totalItems={pendingUsers.length}
                      />
                    </details>
                  </div>
                </section>

                <section className="admin-panel">
                  <div className="admin-post-groups">
                    <details className="admin-post-group">
                      <summary>
                        <span>会員アカウント照会</span>
                        <span className="admin-summary-meta">
                          <span className="total-count">全{users.length}件</span>
                        </span>
                      </summary>
                      <p className="admin-panel-help">ログイン用メールアドレスを忘れた会員について、本人確認後に氏名・所属・会社名から照会してください。</p>
                      <p className="admin-list-range">{itemRange(users.length, accountPage)}</p>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead><tr><th>氏名</th><th>メール</th><th>所属・会社</th><th>権限</th><th>操作</th></tr></thead>
                          <tbody>
                            {visibleAccountUsers.length ? visibleAccountUsers.map((profile) => (
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
                      <Pagination
                        currentPage={accountPage}
                        onPageChange={setAccountPage}
                        pageSize={ADMIN_PAGE_SIZE}
                        scrollToTop={false}
                        totalItems={users.length}
                      />
                    </details>
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
                                    <td>
                                      {post.is_featured && <span className="featured-badge">優先</span>}
                                      {postTitle(post)}
                                    </td>
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
                                      <Link className="icon-action" href={postHref(post)}>
                                        <Eye size={16} /> 詳細
                                      </Link>
                                      {post.approval_status === "approved" && (
                                        <button className={post.is_featured ? "icon-action featured" : "icon-action"} type="button" onClick={() => toggleFeatured(post)}>
                                          <Star size={16} /> {post.is_featured ? "優先解除" : "優先表示"}
                                        </button>
                                      )}
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

function postHref(post: PendingContent) {
  const path = post.sourceTable === "marche_posts" ? "marche" : post.sourceTable;
  return `/${path}/${post.id}`;
}

function itemRange(totalItems: number, currentPage: number) {
  if (totalItems === 0) return "0件";
  const start = (currentPage - 1) * ADMIN_PAGE_SIZE + 1;
  const end = Math.min(currentPage * ADMIN_PAGE_SIZE, totalItems);
  return `全${totalItems}件中 ${start}〜${end}件を表示`;
}

function RankingBox({ title, items }: { title: string; items: RankingItem[] }) {
  return (
    <div className="ranking-box">
      <h3>{title}</h3>
      {items.length ? (
        <ol>
          {items.map((item) => (
            <li key={`${title}-${item.name}`}>
              <span>{item.name}</span>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ol>
      ) : <p>データがありません。</p>}
    </div>
  );
}

function exportDealsCsv(deals: BusinessDeal[], users: Profile[]) {
  const profileMap = new Map(users.map((profile) => [profile.id, profile]));
  const rows = [
    ["商談名", "状態", "依頼者", "受注者", "紹介者", "金額", "コメント", "作成日"],
    ...deals.map((deal) => [
      deal.title,
      dealStatusLabels[deal.status],
      profileName(profileMap.get(deal.requester_id)),
      profileName(profileMap.get(deal.contractor_id)),
      profileName(deal.introducer_id ? profileMap.get(deal.introducer_id) : undefined),
      String(deal.amount || ""),
      deal.comment || "",
      deal.created_at || "",
    ]),
  ];
  downloadCsv("business-deals.csv", rows);
}

function exportSkillsCsv(rankings: SkillRankings) {
  const rows = [["種別", "名称", "件数"]];
  for (const [label, items] of [
    ["資格", rankings.qualifications || []],
    ["得意分野", rankings.specialties || []],
    ["検索", rankings.searches || []],
    ["相談", rankings.consultations || []],
  ] as const) {
    for (const item of items) rows.push([label, item.name, String(item.count)]);
  }
  downloadCsv("skill-rankings.csv", rows);
}

function exportLoginEventsCsv(events: LoginEvent[], users: Profile[]) {
  const profileMap = new Map(users.map((profile) => [profile.id, profile]));
  const rows = [
    ["ログイン日時", "氏名", "メール", "所属単会", "会社名", "利用環境"],
    ...events.map((event) => {
      const profile = event.user_id ? profileMap.get(event.user_id) : undefined;
      return [
        event.created_at ? new Date(event.created_at).toLocaleString("ja-JP") : "",
        profile?.full_name || "",
        event.email || profile?.email || "",
        profile?.local_chapter || "",
        profile?.company_name || "",
        event.user_agent || "",
      ];
    }),
  ];
  downloadCsv("login-events.csv", rows);
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function profileName(profile?: Profile) {
  return profile?.full_name || profile?.company_name || profile?.email || "";
}

function shortUserAgent(userAgent?: string | null) {
  if (!userAgent) return "未取得";
  if (userAgent.includes("iPhone")) return "iPhone / Safari等";
  if (userAgent.includes("Android")) return "Android / Chrome等";
  if (userAgent.includes("Macintosh")) return "Mac / Safari・Chrome等";
  if (userAgent.includes("Windows")) return "Windows / Edge・Chrome等";
  return userAgent.slice(0, 80);
}
