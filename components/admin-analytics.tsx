"use client";

import {
  Activity,
  BarChart3,
  Building2,
  Database,
  Eye,
  HardDrive,
  Heart,
  MessageCircle,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Summary = {
  total_views: number;
  period_views: number;
  unique_visitors: number;
  logged_in_visitors: number;
  registered_members: number;
  approved_members: number;
  pending_members: number;
  new_members: number;
  registered_businesses: number;
  approved_businesses: number;
  pending_businesses: number;
  total_posts: number;
  likes: number;
  messages: number;
  database_bytes: number;
  storage_bytes: number;
  storage_objects: number;
};

type DailyView = {
  view_date: string;
  views: number;
  visitors: number;
};

type TopPage = {
  path: string;
  views: number;
};

const emptySummary: Summary = {
  total_views: 0,
  period_views: 0,
  unique_visitors: 0,
  logged_in_visitors: 0,
  registered_members: 0,
  approved_members: 0,
  pending_members: 0,
  new_members: 0,
  registered_businesses: 0,
  approved_businesses: 0,
  pending_businesses: 0,
  total_posts: 0,
  likes: 0,
  messages: 0,
  database_bytes: 0,
  storage_bytes: 0,
  storage_objects: 0,
};

export function AdminAnalytics() {
  const [summary, setSummary] = useState(emptySummary);
  const [daily, setDaily] = useState<DailyView[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const [summaryResult, dailyResult, topResult] = await Promise.all([
        supabase.rpc("admin_analytics_summary", { period_days: 30 }),
        supabase.rpc("admin_daily_page_views", { period_days: 30 }),
        supabase.rpc("admin_top_pages", { period_days: 30, result_limit: 5 }),
      ]);

      const firstError = summaryResult.error || dailyResult.error || topResult.error;
      if (firstError) {
        if (/function .* does not exist|schema cache/i.test(firstError.message)) {
          setSetupRequired(true);
        } else {
          setError(firstError.message);
        }
        setLoading(false);
        return;
      }

      setSummary({ ...emptySummary, ...(summaryResult.data as Summary) });
      setDaily((dailyResult.data as DailyView[]) || []);
      setTopPages((topResult.data as TopPage[]) || []);
      setSetupRequired(false);
      setLoading(false);
    }

    void load();
  }, []);

  const maxViews = Math.max(...daily.map((item) => Number(item.views)), 1);
  const registrationRate = summary.unique_visitors
    ? Math.min(100, (summary.new_members / summary.unique_visitors) * 100)
    : 0;
  const engagement = summary.likes + summary.messages;
  const activeMemberRate = summary.approved_members
    ? Math.min(100, (summary.logged_in_visitors / summary.approved_members) * 100)
    : 0;

  const cards = [
    { label: "累計閲覧数", value: summary.total_views, icon: Eye },
    { label: "直近30日閲覧数", value: summary.period_views, icon: Activity },
    { label: "30日ユニーク訪問者", value: summary.unique_visitors, icon: Users },
    { label: "30日ログイン利用者", value: summary.logged_in_visitors, icon: TrendingUp },
    { label: "登録会員総数", value: summary.registered_members, icon: Users },
    { label: "承認済み会員", value: summary.approved_members, icon: Users },
    { label: "承認待ち会員", value: summary.pending_members, icon: UserPlus },
    { label: "30日新規会員", value: summary.new_members, icon: UserPlus },
    { label: "登録事業者総数", value: summary.registered_businesses, icon: Building2 },
    { label: "承認済み事業者", value: summary.approved_businesses, icon: Building2 },
    { label: "承認待ち事業者", value: summary.pending_businesses, icon: Building2 },
    { label: "全投稿数", value: summary.total_posts, icon: BarChart3 },
    { label: "いいね数", value: summary.likes, icon: Heart },
    { label: "DM送信数", value: summary.messages, icon: MessageCircle },
    { label: "DB概算容量", value: formatBytes(summary.database_bytes), icon: Database },
    {
      label: `画像容量（${summary.storage_objects.toLocaleString("ja-JP")}点）`,
      value: formatBytes(summary.storage_bytes),
      icon: HardDrive,
    },
  ];

  return (
    <section className="admin-panel analytics-panel">
      <div className="analytics-heading">
        <div>
          <h2>利用状況・有料化判断</h2>
          <p className="admin-panel-help">
            直近30日間の利用状況と、契約プラン見直しの判断材料です。
          </p>
        </div>
        <span className="analytics-period">過去30日</span>
      </div>

      {loading ? (
        <p>利用状況を集計しています...</p>
      ) : setupRequired ? (
        <p className="pending-banner">
          アクセス集計SQLの適用後から記録を開始します。
        </p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <div className="analytics-grid">
            {cards.map(({ label, value, icon: Icon }) => (
              <div className="analytics-card" key={label}>
                <Icon size={19} />
                <strong>
                  {typeof value === "number" ? value.toLocaleString("ja-JP") : value}
                </strong>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="analytics-insights">
            <div>
              <span>登録転換率の参考値</span>
              <strong>{registrationRate.toFixed(1)}%</strong>
              <small>30日新規会員 ÷ 30日ユニーク訪問者</small>
            </div>
            <div>
              <span>交流アクション</span>
              <strong>{engagement.toLocaleString("ja-JP")}件</strong>
              <small>いいねとDMの累計</small>
            </div>
            <div>
              <span>会員利用率の参考値</span>
              <strong>{activeMemberRate.toFixed(1)}%</strong>
              <small>30日ログイン利用者 ÷ 承認済み会員</small>
            </div>
          </div>

          <div className="analytics-columns">
            <div>
              <h3>日別アクセス数推移</h3>
              <div className="analytics-chart" aria-label="直近30日の日別アクセス数">
                {daily.map((item) => (
                  <div className="analytics-bar-item" key={item.view_date}>
                    <span
                      className="analytics-bar"
                      style={{ height: `${Math.max(5, (Number(item.views) / maxViews) * 100)}%` }}
                      title={`${formatShortDate(item.view_date)}: ${item.views}閲覧`}
                    />
                    <small>{formatDay(item.view_date)}</small>
                  </div>
                ))}
              </div>
              <p className="analytics-chart-note">棒に触れると日付と閲覧数を確認できます。</p>
            </div>

            <div>
              <h3>よく見られているページ</h3>
              <ol className="top-pages">
                {topPages.length ? topPages.map((page) => (
                  <li key={page.path}>
                    <code>{pageLabel(page.path)}</code>
                    <strong>{Number(page.views).toLocaleString("ja-JP")}回</strong>
                  </li>
                )) : <li>閲覧データはまだありません。</li>}
              </ol>
            </div>
          </div>
        </>
      )}

      <div className="upgrade-checklist">
        <h3><Database size={19} /> 有料化前に外部管理画面で確認する項目</h3>
        <p className="plan-purpose-note">
          <strong>利用目的も確認：</strong>
          Vercel Hobbyは個人・非商用向けです。青年部の公式業務として継続運用する場合は、
          アクセス数が少なくてもProプランを検討してください。
        </p>
        <div className="upgrade-check-grid">
          <a href="https://supabase.com/dashboard" rel="noopener noreferrer" target="_blank">
            <HardDrive size={18} />
            <span><strong>Supabase Usage</strong>DB容量、画像容量、転送量、月間利用者数</span>
          </a>
          <a href="https://vercel.com/dashboard" rel="noopener noreferrer" target="_blank">
            <Activity size={18} />
            <span><strong>Vercel Usage</strong>データ転送量、リクエスト数、Functions使用量</span>
          </a>
        </div>
        <p>
          どれかが無料枠の70〜80%に達した時、業務利用の継続性が重要になった時、
          または複数管理者で運用したくなった時を切替検討の目安にしてください。
        </p>
      </div>
    </section>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(
    new Date(`${value}T00:00:00+09:00`),
  );
}

function formatDay(value: string) {
  return new Date(`${value}T00:00:00+09:00`).getDate().toString();
}

function pageLabel(path: string) {
  const labels: Record<string, string> = {
    "/": "トップページ",
    "/businesses": "事業者検索",
    "/problems": "困りごと相談",
    "/collaborations": "コラボ募集",
    "/successes": "成功事例",
    "/marche": "マルシェ",
    "/members": "青年部員",
    "/messages": "DM",
    "/auth": "ログイン・会員登録",
  };
  return labels[path] || path;
}

function formatBytes(value: number) {
  if (!value) return "0 MB";
  const megabytes = value / 1024 / 1024;
  if (megabytes < 1024) return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
  return `${(megabytes / 1024).toFixed(2)} GB`;
}
