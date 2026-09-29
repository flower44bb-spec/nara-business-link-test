"use client";

import { Building2, MapPin, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApprovalGate } from "@/components/approval-gate";
import { useAuth } from "@/components/auth-provider";
import { DeleteButton } from "@/components/delete-button";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { recordDescription, recordTitle } from "@/lib/records";
import { supabase } from "@/lib/supabase";
import type { BaseRecord } from "@/types";

export default function MyBusinessesPage() {
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<BaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setBusinesses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        setBusinesses((data as BaseRecord[]) ?? []);
        setError(fetchError?.message || "");
        setLoading(false);
      });
  }, [user]);

  return (
    <main>
      <PageHero
        eyebrow="My Businesses"
        title="自分の登録事業者"
        description="同じ会員アカウントで複数の会社・店舗・事業・サービスを登録し、それぞれ個別に管理できます。"
      />
      <section className="page-content">
        <div className="container">
          <HomeLink />
          <ApprovalGate action="登録事業者の管理">
            <div className="toolbar">
              <div>
                <h2>登録事業者</h2>
                <p className="admin-panel-help">現在 {businesses.length}件登録されています。</p>
              </div>
              <Link className="button" href="/businesses/new">
                <Plus size={17} /> 事業者を追加登録
              </Link>
            </div>

            {authLoading || loading ? <Loading /> : error ? (
              <p className="error">事業者情報を取得できませんでした: {error}</p>
            ) : businesses.length ? (
              <div className="my-business-grid">
                {businesses.map((business) => (
                  <article className="my-business-card" key={business.id}>
                    <div className="my-business-card-image">
                      {business.image_url ? (
                        <img src={String(business.image_url)} alt={recordTitle(business)} />
                      ) : (
                        <Building2 size={40} />
                      )}
                    </div>
                    <div className="my-business-card-body">
                      <span className="tag">{String(business.category || "業種未設定")}</span>
                      <h3>{recordTitle(business)}</h3>
                      <p className="linked-business-meta"><MapPin size={14} /> {String(business.area || "地域未設定")}</p>
                      <p className="summary">{recordDescription(business).slice(0, 120)}</p>
                      <div className="form-actions my-business-actions">
                        <Link className="button secondary" href={`/businesses/${business.id}`}>詳細を見る</Link>
                        <Link className="button secondary" href={`/businesses/${business.id}/edit`}><Pencil size={16} /> 編集</Link>
                        <DeleteButton table="businesses" id={String(business.id)} redirect="/businesses/mine" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="gate-card">
                <Building2 size={34} />
                <h3>事業者情報はまだ登録されていません</h3>
                <p>会社・店舗・事業・サービスごとに登録できます。</p>
                <Link className="button" href="/businesses/new"><Plus size={17} /> 最初の事業者を登録</Link>
              </div>
            )}
          </ApprovalGate>
        </div>
      </section>
    </main>
  );
}
