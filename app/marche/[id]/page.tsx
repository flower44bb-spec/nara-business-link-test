"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { DeleteButton } from "@/components/delete-button";
import { LikeButton } from "@/components/like-button";
import { MessageUserButton } from "@/components/message-user-button";
import { PostAuthor as PostAuthorDisplay } from "@/components/post-author";
import { BackLink, Empty, Loading, PageHero } from "@/components/ui";
import { fetchPostAuthors } from "@/lib/post-authors";
import { supabase } from "@/lib/supabase";
import type { MarchePost, PostAuthor } from "@/types";

export default function MarcheDetailPage() {
  const { id } = useParams<{ id: string }>();
  const saved = useSearchParams().get("saved");
  const { user, isApproved, isAdmin } = useAuth();
  const [post, setPost] = useState<MarchePost | null>(null);
  const [author, setAuthor] = useState<PostAuthor>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("marche_posts").select("*").eq("id", id).single().then(async ({ data }) => {
      const loadedPost = data as MarchePost | null;
      setPost(loadedPost);
      if (loadedPost?.user_id) {
        try {
          const authorMap = await fetchPostAuthors([loadedPost.user_id]);
          setAuthor(authorMap.get(loadedPost.user_id));
        } catch {
          setAuthor(undefined);
        }
      }
      setLoading(false);
    });
  }, [id]);

  const canManage = Boolean(post && user && (isAdmin || (isApproved && post.user_id === user.id)));

  return (
    <main>
      <PageHero eyebrow="Marche & Event Detail" title="イベント情報詳細" description="開催概要、PR内容、募集情報をご確認ください。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/marche" />
          {saved === "new" && <p className="notice">投稿を受け付けました。管理者承認後に一般公開されます。</p>}
          {saved === "edit" && (
            <p className="notice">
              {isAdmin ? "変更を保存しました。" : "変更を保存しました。管理者の再承認後に一般公開されます。"}
            </p>
          )}
          {loading ? <Loading /> : !post ? <Empty text="案件が見つかりません。" /> : (
            <div className="detail-layout">
              <article className="detail-card">
                {post.image_url && <img className="detail-image" src={post.image_url} alt={post.event_name} />}
                {post.approval_status !== "approved" && <span className="status pending">承認待ち</span>}
                <h1>{post.event_name}</h1>
                <p className="detail-description">{post.description}</p>
                <h2 className="detail-subheading">投稿者情報</h2>
                <PostAuthorDisplay author={author} />
                <LikeButton targetType="marche_posts" targetId={id} ownerId={post.user_id} />
                <dl className="detail-list">
                  <div className="detail-row"><dt>開催日</dt><dd>{post.event_date}</dd></div>
                  <div className="detail-row"><dt>開催場所</dt><dd>{post.location}</dd></div>
                  <div className="detail-row"><dt>掲載種別</dt><dd>{post.event_type || "マルシェ"}</dd></div>
                  <div className="detail-row"><dt>主催区分</dt><dd>{post.organizer_type || "未設定"}</dd></div>
                  <div className="detail-row"><dt>主催者名</dt><dd>{post.organizer}</dd></div>
                  <div className="detail-row"><dt>対象者</dt><dd>{post.target_audience || "指定なし"}</dd></div>
                  <div className="detail-row"><dt>募集内容・業種</dt><dd>{post.desired_industries || "募集情報なし"}</dd></div>
                  <div className="detail-row"><dt>申込・募集締切</dt><dd>{post.application_deadline || "主催者へ確認"}</dd></div>
                  <div className="detail-row"><dt>出店料・参加費</dt><dd>{post.booth_fee || "主催者へ確認"}</dd></div>
                </dl>
              </article>
              <aside className="side-card">
                <h3>イベントについて相談</h3>
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
