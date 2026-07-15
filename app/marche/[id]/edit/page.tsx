"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MarcheForm } from "@/components/marche-form";
import { BackLink, Loading, PageHero } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { MarchePost } from "@/types";
import { useAuth } from "@/components/auth-provider";
import { ApprovalGate } from "@/components/approval-gate";

export default function EditMarchePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState<MarchePost | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("marche_posts").select("*").eq("id", id).single().then(({ data }) => {
      setPost(data as MarchePost | null);
      setLoading(false);
    });
  }, [id]);
  return (
    <main>
      <PageHero eyebrow="Edit Event" title="イベント情報を編集" description="編集後は再度管理者の承認が必要です。" />
      <section className="page-content">
        <div className="container">
          <BackLink href={`/marche/${id}`} />
          <div className="form-card">
            {loading ? <Loading /> : post ? (
              isAdmin || post.user_id === user?.id
                ? <MarcheForm post={post} />
                : <ApprovalGate adminOnly action="この案件の編集"><span /></ApprovalGate>
            ) : <p className="error">案件が見つかりません。</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
