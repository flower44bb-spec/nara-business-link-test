import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { formatDate, recordDescription, recordTitle } from "@/lib/records";
import type { BaseRecord, ResourceConfig } from "@/types";
import { LikeButton } from "./like-button";

export function ResourceCard({
  item,
  config,
  likeCount,
}: {
  item: BaseRecord;
  config: ResourceConfig;
  likeCount?: number;
}) {
  return (
    <article className="card">
      <div className="card-body">
        {item.approval_status && item.approval_status !== "approved" && (
          <span className={`status ${item.approval_status}`}>{item.approval_status === "pending" ? "承認待ち" : "却下"}</span>
        )}
        <span className="tag">{String(item.category || config.label)}</span>
        <h3>{recordTitle(item)}</h3>
        <div className="meta">
          {item.area && <span><MapPin size={13} /> {String(item.area)}</span>}
          {item.created_at && <span><CalendarDays size={13} /> {formatDate(item.created_at)}</span>}
          <LikeButton targetType={config.table} targetId={String(item.id)} ownerId={item.user_id} initialCount={likeCount} compact />
        </div>
        <p className="summary">{recordDescription(item).slice(0, 120)}</p>
        {config.table === "successes" && item.result && (
          <p className="notice">成果: {String(item.result)}</p>
        )}
        <Link className="text-link" href={`/${config.table}/${item.id}`}>
          詳細を見る <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
