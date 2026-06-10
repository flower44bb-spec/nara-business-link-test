"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApprovalGate } from "@/components/approval-gate";
import { useAuth } from "@/components/auth-provider";
import { ResourceForm } from "@/components/resource-form";
import { BackLink, Loading, PageHero } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { BaseRecord, ResourceConfig } from "@/types";

export function ResourceEditPage({ config }: { config: ResourceConfig }) {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [item, setItem] = useState<BaseRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from(config.table)
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setItem(data as BaseRecord | null);
        setLoading(false);
      });
  }, [config.table, id]);

  const canEdit = Boolean(item && user && (isAdmin || item.user_id === user.id));

  return (
    <main>
      <PageHero
        eyebrow={`Edit ${config.accent}`}
        title={`${config.label}を編集`}
        description="投稿内容を最新の情報に更新できます。一般会員の編集後は再度管理者の承認が必要です。"
      />
      <section className="page-content">
        <div className="container">
          <BackLink href={`/${config.table}/${id}`} />
          <div className="form-card">
            <h2>{config.label} 編集フォーム</h2>
            {loading ? (
              <Loading />
            ) : !item ? (
              <p className="error">投稿が見つかりません。</p>
            ) : canEdit ? (
              <ResourceForm config={config} item={item} />
            ) : (
              <ApprovalGate adminOnly action="この投稿の編集"><span /></ApprovalGate>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
