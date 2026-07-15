"use client";

import { BriefcaseBusiness, CalendarDays, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApprovalGate } from "@/components/approval-gate";
import { useAuth } from "@/components/auth-provider";
import { Pagination, paginate } from "@/components/pagination";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { dealStatusLabels, formatDealAmount } from "@/lib/deals";
import { supabase } from "@/lib/supabase";
import type { BusinessDeal, Profile } from "@/types";

const PAGE_SIZE = 20;

export default function DealsPage() {
  const { user, isApproved } = useAuth();
  const [deals, setDeals] = useState<BusinessDeal[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isApproved) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase
        .from("business_deals")
        .select("*")
        .order("updated_at", { ascending: false });
      const loadedDeals = (data as BusinessDeal[]) ?? [];
      setDeals(loadedDeals);
      const ids = Array.from(new Set(loadedDeals.flatMap((deal) => [
        deal.requester_id,
        deal.contractor_id,
        deal.introducer_id,
      ]).filter(Boolean) as string[]));
      if (ids.length) {
        const { data: profileData } = await supabase.from("public_profiles").select("*").in("id", ids);
        setProfiles(new Map(((profileData as Profile[]) ?? []).map((profile) => [profile.id, profile])));
      }
      setLoading(false);
    }
    load();
  }, [isApproved, user]);

  const filtered = useMemo(() => {
    const query = keyword.toLocaleLowerCase();
    return deals.filter((deal) => {
      const requester = profiles.get(deal.requester_id);
      const contractor = profiles.get(deal.contractor_id);
      const text = [
        deal.title,
        deal.category,
        deal.area,
        deal.description,
        deal.comment,
        requester?.full_name,
        requester?.company_name,
        contractor?.full_name,
        contractor?.company_name,
      ].join(" ").toLocaleLowerCase();
      return (!status || deal.status === status) && (!query || text.includes(query));
    });
  }, [deals, keyword, profiles, status]);

  const visible = paginate(filtered, page, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [keyword, status]);

  return (
    <main>
      <PageHero eyebrow="Business Deals" title="商談管理" description="DMや投稿から始まった相談を、成約・継続取引まで追えるようにします。" />
      <section className="page-content">
        <div className="container">
          <HomeLink />
          <ApprovalGate action="商談管理">
            <div className="search-panel">
              <div className="search-grid">
                <input aria-label="商談検索" placeholder="商談名・会社名・地域で検索" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                <select aria-label="商談状態" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">すべての状態</option>
                  {Object.entries(dealStatusLabels).map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
                <button className="button" type="button"><Search size={17} /> 検索</button>
              </div>
            </div>
            {loading ? <Loading /> : (
              <>
                <div className="card-grid">
                  {visible.map((deal) => (
                    <Link className="content-card" href={`/deals/${deal.id}`} key={deal.id}>
                      <span className={`status ${deal.status}`}>{dealStatusLabels[deal.status]}</span>
                      <h3>{deal.title}</h3>
                      <p>{deal.description || "商談内容は詳細画面で確認できます。"}</p>
                      <div className="meta">
                        <span><BriefcaseBusiness size={14} /> {formatDealAmount(deal.amount)}</span>
                        <span><CalendarDays size={14} /> {new Date(deal.updated_at || deal.created_at).toLocaleDateString("ja-JP")}</span>
                      </div>
                      <p className="author-line">
                        依頼者：{profiles.get(deal.requester_id)?.company_name || profiles.get(deal.requester_id)?.full_name || "未設定"}
                      </p>
                      <p className="author-line">
                        受注者：{profiles.get(deal.contractor_id)?.company_name || profiles.get(deal.contractor_id)?.full_name || "未設定"}
                      </p>
                    </Link>
                  ))}
                </div>
                {!filtered.length && <p className="state-box">商談はまだありません。投稿詳細やDMから商談を開始できます。</p>}
                <Pagination currentPage={page} onPageChange={setPage} pageSize={PAGE_SIZE} totalItems={filtered.length} />
              </>
            )}
          </ApprovalGate>
        </div>
      </section>
    </main>
  );
}
