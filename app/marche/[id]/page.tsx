"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { DeleteButton } from "@/components/delete-button";
import { LikeButton } from "@/components/like-button";
import { MessageUserButton } from "@/components/message-user-button";
import { BackLink, Empty, Loading, PageHero } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { MarchePost } from "@/types";

export default function MarcheDetailPage() {
  const { id } = useParams<{ id: string }>();
  const saved = useSearchParams().get("saved");
  const { user, isApproved, isAdmin } = useAuth();
  const [post, setPost] = useState<MarchePost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("marche_posts").select("*").eq("id", id).single().then(({ data }) => {
      setPost(data as MarchePost | null);
      setLoading(false);
    });
  }, [id]);

  const canManage = Boolean(post && user && (isAdmin || (isApproved && post.user_id === user.id)));

  return (
    <main>
      <PageHero eyebrow="Marche Detail" title="マルシェ案件詳細" description="開催概要、出店条件、募集締切をご確認ください。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/marche" />
          {saved && <p className="notice">保存しました。管理者承認後に一般公開されます。</p>}
          {loading ? <Loading /> : !post ? <Empty text="案件が見つかりません。" /> : (
            <div className="detail-layout">
              <article className="detail-card">
                {post.image_url && <img className="detail-image" src={post.image_url} alt={post.event_name} />}
                {post.approval_status !== "approved" && <span className="status pending">承認待ち</span>}
                <h1>{post.event_name}</h1>
                <p className="detail-description">{post.description}</p>
                <LikeButton targetType="marche_posts" targetId={id} ownerId={post.user_id} />
                <dl className="detail-list">
                  <div className="detail-row"><dt>開催日</dt><dd>{post.event_date}</dd></div>
                  <div className="detail-row"><dt>開催場所</dt><dd>{post.location}</dd></div>
                  <div className="detail-row"><dt>募集業種</dt><dd>{post.desired_industries || "指定なし"}</dd></div>
                  <div className="detail-row"><dt>募集締切</dt><dd>{post.application_deadline || "定員まで"}</dd></div>
                  <div className="detail-row"><dt>出店料</dt><dd>{post.booth_fee || "主催者へ確認"}</dd></div>
                  <div className="detail-row"><dt>主催者</dt><dd>{post.organizer}</dd></div>
                </dl>
              </article>
              <aside className="side-card">
                <h3>出店について相談</h3>
                <MessageUserButton recipientId={post.user_id} />
                {canManage && (
                  <>
                    <Link className="button secondary" href={`/marche/${id}/edit`}><Pencil size={16} /> 編集</Link>
                    <DeleteButton table="marche_posts" id={id} redirect="/marche" />
                  </>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
