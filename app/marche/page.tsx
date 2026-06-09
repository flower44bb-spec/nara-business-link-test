"use client";

import { CalendarDays, MapPin, Plus, Store } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { LikeButton } from "@/components/like-button";
import { supabase } from "@/lib/supabase";
import type { MarchePost } from "@/types";

export default function MarchePage() {
  const [posts, setPosts] = useState<MarchePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("marche_posts").select("*").order("event_date").then(({ data, error: fetchError }) => {
      if (fetchError) setError(fetchError.message);
      setPosts((data as MarchePost[]) ?? []);
      setLoading(false);
    });
  }, []);

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
          {error && <p className="error">{error}</p>}
          {loading ? <Loading /> : (
            <div className="card-grid">
              {posts.map((post) => (
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
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
