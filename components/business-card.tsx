import { ArrowRight, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { recordDescription, recordTitle } from "@/lib/records";
import type { BaseRecord, PostAuthor } from "@/types";
import { LikeButton } from "./like-button";
import { PostAuthor as PostAuthorDisplay } from "./post-author";

export function BusinessCard({
  business,
  likeCount,
  author,
}: {
  business: BaseRecord;
  likeCount?: number;
  author?: PostAuthor;
}) {
  return (
    <article className={business.is_featured ? "card featured-card" : "card"}>
      {business.is_featured && <div className="featured-ribbon">注目情報</div>}
      <div className="card-image">
        {business.image_url ? (
          <img src={business.image_url} alt={recordTitle(business)} />
        ) : (
          <Building2 size={52} />
        )}
      </div>
      <div className="card-body">
        {business.approval_status && business.approval_status !== "approved" && (
          <span className={`status ${business.approval_status}`}>{business.approval_status === "pending" ? "承認待ち" : "却下"}</span>
        )}
        {business.is_featured && <span className="featured-badge">ピックアップ</span>}
        <span className="tag">{String(business.category || "業種未設定")}</span>
        <h3>{recordTitle(business)}</h3>
        <PostAuthorDisplay author={author} compact />
        <div className="meta">
          <span><MapPin size={13} /> {String(business.area || "奈良県")}</span>
          <LikeButton targetType="businesses" targetId={String(business.id)} ownerId={business.user_id} initialCount={likeCount} compact />
        </div>
        <p className="summary">{recordDescription(business).slice(0, 90)}</p>
        <Link className="text-link" href={`/businesses/${business.id}`}>
          詳細を見る <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
