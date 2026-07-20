"use client";

import { Building2, CircleCheckBig, Flame, Handshake, JapaneseYen, Sparkles, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { recordDescription, recordTitle } from "@/lib/records";
import { supabase } from "@/lib/supabase";
import type { BaseRecord } from "@/types";

type Stats = {
  members: number;
  businesses: number;
  thisMonthDeals: number;
  totalDeals: number;
  collaborations: number;
  resolvedProblems: number;
  transactionAmount: number;
};

const initialStats: Stats = {
  members: 0,
  businesses: 0,
  thisMonthDeals: 0,
  totalDeals: 0,
  collaborations: 0,
  resolvedProblems: 0,
  transactionAmount: 0,
};

type HomePost = BaseRecord & { sourceTable: string; sourceLabel: string; likeCount?: number };

const sources = [
  { table: "businesses", label: "事業者", href: "businesses" },
  { table: "problems", label: "困りごと", href: "problems" },
  { table: "collaborations", label: "コラボ", href: "collaborations" },
  { table: "successes", label: "成功事例", href: "successes" },
  { table: "marche_posts", label: "イベント", href: "marche" },
] as const;

export function HomeStats() {
  const [stats, setStats] = useState(initialStats);
  const [featuredPosts, setFeaturedPosts] = useState<HomePost[]>([]);
  const [latestPosts, setLatestPosts] = useState<HomePost[]>([]);
  const [urgentPosts, setUrgentPosts] = useState<HomePost[]>([]);
  const [popularPosts, setPopularPosts] = useState<HomePost[]>([]);

  useEffect(() => {
    async function load() {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const [members, businesses, collaborations, problems, successes, deals] = await Promise.all([
        supabase
          .from("public_profiles")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("businesses")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "approved"),
        supabase
          .from("collaborations")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "approved")
          .eq("collaboration_status", "successful"),
        supabase
          .from("problems")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "approved")
          .not("resolved_at", "is", null),
        supabase
          .from("successes")
          .select("transaction_amount")
          .eq("approval_status", "approved")
          .not("transaction_amount", "is", null),
        supabase
          .from("business_deals")
          .select("id, amount, status, updated_at"),
      ]);

      const closedDeals = ((deals.data as { amount?: number | null; status?: string | null; updated_at?: string | null }[]) ?? [])
        .filter((deal) => ["contracted", "ongoing", "closed"].includes(String(deal.status)));
      const dealAmount = closedDeals.reduce((total, deal) => total + Number(deal.amount || 0), 0);
      const successAmount = (successes.data ?? []).reduce(
        (total, item) => total + Number(item.transaction_amount || 0),
        0,
      );

      setStats({
        members: members.count ?? 0,
        businesses: businesses.count ?? 0,
        thisMonthDeals: closedDeals.filter((deal) => deal.updated_at && new Date(deal.updated_at) >= thisMonth).length,
        totalDeals: closedDeals.length,
        collaborations: collaborations.count ?? 0,
        resolvedProblems: problems.count ?? 0,
        transactionAmount: Math.max(dealAmount, successAmount),
      });

      const results = await Promise.all(
        sources.map(async (source) => {
          const { data } = await supabase
            .from(source.table)
            .select("*")
            .eq("approval_status", "approved")
            .order("created_at", { ascending: false })
            .limit(6);
          return ((data as BaseRecord[]) ?? []).map((item) => ({ ...item, sourceTable: source.href, sourceLabel: source.label }));
        }),
      );
      const featuredResults = await Promise.all(
        sources.map(async (source) => {
          const { data, error } = await supabase
            .from(source.table)
            .select("*")
            .eq("approval_status", "approved")
            .eq("is_featured", true)
            .order("featured_at", { ascending: false })
            .limit(4);
          if (error) return [];
          return ((data as BaseRecord[]) ?? []).map((item) => ({ ...item, sourceTable: source.href, sourceLabel: source.label }));
        }),
      );
      const combined = results.flat().sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
      setFeaturedPosts(
        featuredResults
          .flat()
          .sort((a, b) => String(b.featured_at || b.created_at || "").localeCompare(String(a.featured_at || a.created_at || "")))
          .slice(0, 6),
      );
      setLatestPosts(combined.slice(0, 5));
      setUrgentPosts(combined.filter((item) => `${recordTitle(item)} ${recordDescription(item)} ${item.category || ""}`.includes("急募")).slice(0, 5));

      const { data: likes } = await supabase.from("likes").select("target_type, target_id");
      const likeMap = new Map<string, number>();
      for (const like of (likes as { target_type: string; target_id: string }[]) ?? []) {
        const key = `${like.target_type}:${like.target_id}`;
        likeMap.set(key, (likeMap.get(key) || 0) + 1);
      }
      setPopularPosts(
        combined
          .map((item) => ({ ...item, likeCount: likeMap.get(`${item.sourceTable === "marche" ? "marche_posts" : item.sourceTable}:${item.id}`) || 0 }))
          .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
          .filter((item) => (item.likeCount || 0) > 0)
          .slice(0, 5),
      );
    }

    load();
  }, []);

  const items = [
    { label: "登録青年部員数", value: `${stats.members.toLocaleString("ja-JP")}名`, icon: Users },
    { label: "登録事業者数", value: `${stats.businesses.toLocaleString("ja-JP")}社`, icon: Building2 },
    { label: "今月成立案件", value: `${stats.thisMonthDeals.toLocaleString("ja-JP")}件`, icon: Sparkles },
    { label: "累計成立案件", value: `${stats.totalDeals.toLocaleString("ja-JP")}件`, icon: Trophy },
    { label: "コラボ成功件数", value: `${stats.collaborations.toLocaleString("ja-JP")}件`, icon: Handshake },
    { label: "困りごと解決件数", value: `${stats.resolvedProblems.toLocaleString("ja-JP")}件`, icon: CircleCheckBig },
    {
      label: "総取引金額",
      value: `${stats.transactionAmount.toLocaleString("ja-JP")}円`,
      icon: JapaneseYen,
      isAmount: true,
    },
  ];

  return (
    <section className="stats-section" aria-label="活動実績">
      <div className="container">
        <div className="stats-grid">
          {items.map(({ label, value, icon: Icon, isAmount }) => (
            <div className="stat-card" key={label}>
              <span className="stat-icon"><Icon size={22} /></span>
              <div className="stat-content">
                <strong
                  className={[
                    isAmount ? "stat-amount" : "",
                    isAmount && value.length >= 14 ? "extra-compact" : "",
                    isAmount && value.length >= 11 ? "compact" : "",
                  ].filter(Boolean).join(" ")}
                  title={value}
                >
                  {value}
                </strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="stats-note">管理者承認済みの登録・実績を集計しています。</p>
        <section className="featured-showcase" aria-label="注目ピックアップ">
          <div className="featured-showcase-heading">
            <span><Flame size={18} /> 管理者おすすめ</span>
            <h2>いま見てほしい注目情報</h2>
            <p>青年部内の仕事づくりにつながりやすい投稿を、管理者が優先表示しています。</p>
          </div>
          <div className="featured-showcase-grid">
            {featuredPosts.length ? featuredPosts.map((post) => (
              <Link className="featured-showcase-card" href={`/${post.sourceTable}/${post.id}`} key={`featured-${post.sourceTable}-${post.id}`}>
                <span className="featured-badge">注目ピックアップ</span>
                <span className="tag">{post.sourceLabel}</span>
                <strong>{recordTitle(post)}</strong>
                <p>{recordDescription(post).slice(0, 90)}</p>
              </Link>
            )) : (
              <div className="featured-showcase-empty">
                <strong>注目投稿はまだ設定されていません。</strong>
                <span>管理画面で優先表示をONにすると、ここに大きく表示されます。</span>
              </div>
            )}
          </div>
        </section>
        <div className="home-post-panels">
          <HomePostPanel title="新着投稿" posts={latestPosts} />
          <HomePostPanel title="急募案件" posts={urgentPosts} emptyText="急募の投稿はまだありません。" />
          <HomePostPanel title="人気投稿" posts={popularPosts} emptyText="いいねが付いた投稿はまだありません。" showLikes />
        </div>
      </div>
    </section>
  );
}

function HomePostPanel({
  title,
  posts,
  emptyText = "投稿はまだありません。",
  showLikes = false,
}: {
  title: string;
  posts: HomePost[];
  emptyText?: string;
  showLikes?: boolean;
}) {
  return (
    <div className="home-post-panel">
      <h3>{title}</h3>
      {posts.length ? posts.map((post) => (
        <Link href={`/${post.sourceTable}/${post.id}`} key={`${post.sourceTable}-${post.id}`}>
          <span className="tag">{post.sourceLabel}</span>
          <strong>{recordTitle(post)}</strong>
          {showLikes && <small>{post.likeCount || 0}いいね</small>}
        </Link>
      )) : <p>{emptyText}</p>}
    </div>
  );
}
