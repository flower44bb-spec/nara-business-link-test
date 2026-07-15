import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { formatDate, recordDescription, recordTitle } from "@/lib/records";
import type { BaseRecord, PostAuthor, ResourceConfig } from "@/types";
import { LikeButton } from "./like-button";
import { PostAuthor as PostAuthorDisplay } from "./post-author";

export function ResourceCard({
  item,
  config,
  likeCount,
  author,
}: {
  item: BaseRecord;
  config: ResourceConfig;
  likeCount?: number;
  author?: PostAuthor;
}) {
  return (
    <article className="card">
      <div className="card-body">
        {item.approval_status && item.approval_status !== "approved" && (
          <span className={`status ${item.approval_status}`}>{item.approval_status === "pending" ? "承認待ち" : "却下"}</span>
        )}
        {item.is_featured && <span className="featured-badge">注目</span>}
        <span className="tag">{String(item.category || config.label)}</span>
        {config.table === "collaborations" && item.collaboration_status === "successful" && (
          <span className="status successful">コラボ成功</span>
        )}
        {config.table === "problems" && item.resolved_at && (
          <span className="status successful">解決済み</span>
        )}
        <h3>{recordTitle(item)}</h3>
        <PostAuthorDisplay author={author} compact />
        <div className="meta">
          {item.area && <span><MapPin size={13} /> {String(item.area)}</span>}
          {item.created_at && <span><CalendarDays size={13} /> {formatDate(item.created_at)}</span>}
          <LikeButton targetType={config.table} targetId={String(item.id)} ownerId={item.user_id} initialCount={likeCount} compact />
        </div>
        <p className="summary">{recordDescription(item).slice(0, 120)}</p>
        {config.table === "successes" && item.result && (
          <p className="notice">成果: {String(item.result)}</p>
        )}
        {config.table === "successes" && item.transaction_amount != null && (
          <p className="transaction-amount">
            取引金額 {Number(item.transaction_amount).toLocaleString("ja-JP")}円
          </p>
        )}
        <Link className="text-link" href={`/${config.table}/${item.id}`}>
          詳細を見る <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
