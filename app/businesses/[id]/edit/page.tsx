"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BusinessForm } from "@/components/business-form";
import { BackLink, Loading, PageHero } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { BaseRecord } from "@/types";
import { useAuth } from "@/components/auth-provider";
import { ApprovalGate } from "@/components/approval-gate";

export default function EditBusinessPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [business, setBusiness] = useState<BaseRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("businesses").select("*").eq("id", id).single().then(({ data }) => {
      setBusiness(data as BaseRecord | null);
      setLoading(false);
    });
  }, [id]);

  return (
    <main>
      <PageHero eyebrow="Edit Profile" title="事業者情報を編集" description="掲載している事業内容や画像を最新の情報に更新できます。" />
      <section className="page-content">
        <div className="container">
          <BackLink href={`/businesses/${id}`} />
          <div className="form-card">
            <h2>事業者情報</h2>
            {loading ? <Loading /> : business ? (
              isAdmin || business.user_id === user?.id
                ? <BusinessForm business={business} />
                : <ApprovalGate adminOnly action="この事業者情報の編集"><span /></ApprovalGate>
            ) : <p className="error">事業者情報が見つかりません。</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
