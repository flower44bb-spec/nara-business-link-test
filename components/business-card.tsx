import { ArrowRight, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { recordDescription, recordTitle } from "@/lib/records";
import type { BaseRecord } from "@/types";
import { LikeButton } from "./like-button";

export function BusinessCard({ business, likeCount }: { business: BaseRecord; likeCount?: number }) {
  return (
    <article className="card">
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
        <span className="tag">{String(business.category || "業種未設定")}</span>
        <h3>{recordTitle(business)}</h3>
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
