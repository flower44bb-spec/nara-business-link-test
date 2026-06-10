"use client";

import { CalendarDays, MapPin, Plus, Search, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { LikeButton } from "@/components/like-button";
import { supabase } from "@/lib/supabase";
import type { MarchePost } from "@/types";

export default function MarchePage() {
  const [posts, setPosts] = useState<MarchePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    supabase.from("marche_posts").select("*").eq("approval_status", "approved").order("event_date").then(({ data, error: fetchError }) => {
      if (fetchError) setError(fetchError.message);
      setPosts((data as MarchePost[]) ?? []);
      setLoading(false);
    });
  }, []);

  const locations = useMemo(
    () => [...new Set(posts.map((post) => post.location).filter(Boolean))],
    [posts],
  );
  const industries = useMemo(
    () => [...new Set(posts.flatMap((post) => post.desired_industries ? [post.desired_industries] : []))],
    [posts],
  );
  const filteredPosts = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase("ja");
    return posts.filter((post) => {
      const searchable = [
        post.event_name,
        post.description,
        post.location,
        post.desired_industries,
        post.organizer,
        post.event_date,
      ].join(" ").toLocaleLowerCase("ja");
      return (
        (!query || searchable.includes(query))
        && (!location || post.location === location)
        && (!industry || post.desired_industries === industry)
      );
    });
  }, [industry, keyword, location, posts]);

  return (
    <main>
      <PageHero eyebrow="Marche & Events" title="マルシェ案件掲示板" description="奈良県内のマルシェやイベント出店情報を共有し、地域のにぎわいを一緒につくります。" />
      <section className="page-content">
        <div className="container">
          <HomeLink />
          <div className="toolbar">
            <h2>出店募集案件</h2>
            <Link className="button" href="/marche/new"><Plus size={17} /> 案件を投稿</Link>
          </div>
          <div className="search-panel">
            <div className="search-grid">
              <input
                aria-label="マルシェ案件を検索"
                placeholder="イベント名・募集内容・主催者で検索"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <select aria-label="開催場所で絞り込み" value={location} onChange={(event) => setLocation(event.target.value)}>
                <option value="">すべての開催場所</option>
                {locations.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
              <select aria-label="募集業種で絞り込み" value={industry} onChange={(event) => setIndustry(event.target.value)}>
                <option value="">すべての募集業種</option>
                {industries.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
              <button className="button" type="button"><Search size={18} /> 検索</button>
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          {loading ? <Loading /> : (
            <div className="card-grid">
              {filteredPosts.map((post) => (
                <article className="card" key={post.id}>
                  <div className="card-image">
                    {post.image_url ? <img src={post.image_url} alt={post.event_name} /> : <Store size={48} />}
                  </div>
                  <div className="card-body">
                    <span className="tag">{post.desired_industries || "出店者募集"}</span>
                    <h3>{post.event_name}</h3>
                    <div className="meta">
                      <span><CalendarDays size={13} /> {post.event_date}</span>
                      <span><MapPin size={13} /> {post.location}</span>
                      <LikeButton targetType="marche_posts" targetId={post.id} ownerId={post.user_id} compact />
                    </div>
                    <p className="summary">{post.description.slice(0, 90)}</p>
                    <Link className="text-link" href={`/marche/${post.id}`}>詳細を見る</Link>
                  </div>
                </article>
              ))}
              {!filteredPosts.length && (
                <div className="state-box">
                  <Search />
                  <p>条件に一致するマルシェ案件はありません。</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
