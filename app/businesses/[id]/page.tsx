"use client";

import { Building2, CalendarDays, MapPin, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BackLink, Empty, Loading, PageHero } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { useAuth } from "@/components/auth-provider";
import { formatDate, recordDescription, recordTitle } from "@/lib/records";
import { supabase } from "@/lib/supabase";
import type { BaseRecord } from "@/types";
import { LikeButton } from "@/components/like-button";
import { MessageUserButton } from "@/components/message-user-button";

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const saved = useSearchParams().get("saved");
  const { user, isApproved, isAdmin } = useAuth();
  const [business, setBusiness] = useState<BaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("businesses").select("*").eq("id", id).single().then(({ data, error: fetchError }) => {
      if (fetchError) setError(fetchError.message);
      setBusiness(data as BaseRecord | null);
      setLoading(false);
    });
  }, [id]);

  const canEdit = Boolean(user && business && (isAdmin || (isApproved && business.user_id === user.id)));

  return (
    <main>
      <PageHero eyebrow="Business Profile" title="事業者詳細" description="事業内容や得意分野、求めている連携をご覧いただけます。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/businesses" />
          {saved === "new" && <p className="notice">登録しました。管理者承認後に公開されます。</p>}
          {saved === "edit" && (
            <p className="notice">
              {isAdmin ? "変更を保存しました。" : "変更を保存しました。管理者の再承認後に公開されます。"}
            </p>
          )}
          {loading ? <Loading /> : error || !business ? <Empty text={`事業者情報を取得できませんでした。${error}`} /> : (
            <div className="detail-layout">
              <article className="detail-card">
                {business.approval_status && business.approval_status !== "approved" && (
                  <span className={`status ${business.approval_status}`}>{business.approval_status === "pending" ? "承認待ち" : "却下"}</span>
                )}
                {business.image_url && (
                  <img
                    className="detail-image"
                    src={`${business.image_url}${business.image_url.includes("?") ? "&" : "?"}v=${encodeURIComponent(String(business.updated_at || business.image_url))}`}
                    alt={recordTitle(business)}
                  />
                )}
                <span className="tag">{String(business.category || "業種未設定")}</span>
                <h1>{recordTitle(business)}</h1>
                <div className="meta">
                  <span><MapPin size={14} /> {String(business.area || "奈良県")}</span>
                  {business.created_at && <span><CalendarDays size={14} /> {formatDate(business.created_at)}</span>}
                </div>
                <p className="detail-description">{recordDescription(business)}</p>
                <LikeButton targetType="businesses" targetId={id} ownerId={business.user_id} />
                <dl className="detail-list">
                  <div className="detail-row"><dt>商品・サービス</dt><dd>{String(business.services || "未登録")}</dd></div>
                  <div className="detail-row"><dt>求める連携</dt><dd>{String(business.collaboration_needs || "未登録")}</dd></div>
                  <div className="detail-row"><dt>連絡先</dt><dd>{String(business.contact || "ログイン後、運営へお問い合わせください")}</dd></div>
                </dl>
              </article>
              <aside className="side-card">
                <Building2 size={30} />
                <h3>この事業者に相談する</h3>
                <p className="summary">連携や仕事の相談は、登録された連絡先または青年部事務局を通じてお問い合わせください。</p>
                {canEdit && (
                  <>
                    <Link className="button" href={`/businesses/${id}/edit`}><Pencil size={16} /> 編集する</Link>
                    <DeleteButton table="businesses" id={id} redirect="/businesses" />
                  </>
                )}
                <MessageUserButton recipientId={business.user_id} />
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
