"use client";

import { CalendarDays, CircleCheckBig, Handshake, MapPin } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { DeleteButton } from "@/components/delete-button";
import { BackLink, Empty, Loading, PageHero } from "@/components/ui";
import { formatDate, recordDescription, recordTitle } from "@/lib/records";
import { supabase } from "@/lib/supabase";
import type { BaseRecord, ResourceConfig } from "@/types";
import { LikeButton } from "./like-button";
import { MessageUserButton } from "./message-user-button";

export function ResourceDetail({ config }: { config: ResourceConfig }) {
  const { id } = useParams<{ id: string }>();
  const saved = useSearchParams().get("saved");
  const { user, isApproved, isAdmin } = useAuth();
  const [item, setItem] = useState<BaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from(config.table).select("*").eq("id", id).single().then(({ data, error: fetchError }) => {
      if (fetchError) setError(fetchError.message);
      setItem(data as BaseRecord | null);
      setLoading(false);
    });
  }, [config.table, id]);

  const canDelete = Boolean(user && item && (isAdmin || (isApproved && item.user_id === user.id)));

  async function toggleOutcome() {
    if (!item || !canDelete) return;
    setUpdatingStatus(true);
    setError("");

    const payload =
      config.table === "collaborations"
        ? {
            collaboration_status:
              item.collaboration_status === "successful" ? "open" : "successful",
          }
        : {
            resolved_at: item.resolved_at ? null : new Date().toISOString(),
          };
    const { data, error: updateError } = await supabase
      .from(config.table)
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) setError(updateError.message);
    else setItem(data as BaseRecord);
    setUpdatingStatus(false);
  }

  return (
    <main>
      <PageHero eyebrow={config.accent} title={`${config.label} 詳細`} description={config.intro} />
      <section className="page-content">
        <div className="container">
          <BackLink href={`/${config.table}`} />
          {saved && <p className="notice">投稿を受け付けました。管理者承認後に公開されます。</p>}
          {loading ? <Loading /> : error || !item ? <Empty text={`投稿を取得できませんでした。${error}`} /> : (
            <div className="detail-layout">
              <article className="detail-card">
                {item.approval_status && item.approval_status !== "approved" && (
                  <span className={`status ${item.approval_status}`}>{item.approval_status === "pending" ? "承認待ち" : "却下"}</span>
                )}
                <span className="tag">{String(item.category || config.label)}</span>
                {config.table === "collaborations" && item.collaboration_status === "successful" && (
                  <span className="status successful">コラボ成功</span>
                )}
                {config.table === "problems" && item.resolved_at && (
                  <span className="status successful">解決済み</span>
                )}
                <h1>{recordTitle(item)}</h1>
                <div className="meta">
                  {item.area && <span><MapPin size={14} /> {String(item.area)}</span>}
                  {item.created_at && <span><CalendarDays size={14} /> {formatDate(item.created_at)}</span>}
                </div>
                <p className="detail-description">{recordDescription(item)}</p>
                <LikeButton targetType={config.table} targetId={id} ownerId={item.user_id} />
                {config.table === "successes" && item.result && (
                  <dl className="detail-list">
                    <div className="detail-row"><dt>生まれた成果</dt><dd>{String(item.result)}</dd></div>
                    {item.transaction_amount != null && (
                      <div className="detail-row">
                        <dt>取引金額</dt>
                        <dd>{Number(item.transaction_amount).toLocaleString("ja-JP")}円</dd>
                      </div>
                    )}
                  </dl>
                )}
                {config.table === "successes" && !item.result && item.transaction_amount != null && (
                  <dl className="detail-list">
                    <div className="detail-row">
                      <dt>取引金額</dt>
                      <dd>{Number(item.transaction_amount).toLocaleString("ja-JP")}円</dd>
                    </div>
                  </dl>
                )}
              </article>
              <aside className="side-card">
                <h3>{config.table === "successes" ? "事例を共有する" : "投稿について"}</h3>
                <p className="summary">
                  {config.table === "successes"
                    ? "この事例を青年部内の新しい連携や挑戦にお役立てください。"
                    : "詳しい相談や応募については、青年部の連絡網または事務局を通じて投稿者へお問い合わせください。"}
                </p>
                {canDelete && config.table === "collaborations" && (
                  <button className="button secondary" type="button" onClick={toggleOutcome} disabled={updatingStatus}>
                    <Handshake size={16} />
                    {item.collaboration_status === "successful" ? "募集中に戻す" : "コラボ成功に変更"}
                  </button>
                )}
                {canDelete && config.table === "problems" && (
                  <button className="button secondary" type="button" onClick={toggleOutcome} disabled={updatingStatus}>
                    <CircleCheckBig size={16} />
                    {item.resolved_at ? "未解決に戻す" : "解決済みに変更"}
                  </button>
                )}
                {canDelete && <DeleteButton table={config.table} id={id} redirect={`/${config.table}`} />}
                <MessageUserButton recipientId={item.user_id} />
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
