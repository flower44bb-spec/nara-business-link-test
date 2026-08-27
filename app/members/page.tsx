"use client";

import { Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { recordDescription, recordTitle } from "@/lib/records";
import { supabase } from "@/lib/supabase";
import type { BaseRecord, Profile } from "@/types";

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [businesses, setBusinesses] = useState<BaseRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      supabase.from("public_profiles").select("*").order("full_name"),
      supabase.from("businesses").select("*").eq("approval_status", "approved").order("created_at", { ascending: false }),
    ]).then(([membersResult, businessesResult]) => {
        setMembers((membersResult.data as Profile[]) ?? []);
        setBusinesses((businessesResult.data as BaseRecord[]) ?? []);
        setLoading(false);
      });
  }, []);

  const businessesByUser = useMemo(() => {
    const grouped = new Map<string, BaseRecord[]>();
    for (const business of businesses) {
      if (!business.user_id) continue;
      grouped.set(business.user_id, [...(grouped.get(business.user_id) ?? []), business]);
    }
    return grouped;
  }, [businesses]);

  const filtered = useMemo(() => {
    const query = keyword.toLocaleLowerCase();
    return members.filter((member) => {
      const relatedBusinesses = businessesByUser.get(member.id) ?? [];
      const businessText = relatedBusinesses
        .map((business) => `${recordTitle(business)} ${recordDescription(business)} ${business.category || ""} ${business.area || ""} ${business.services || ""} ${business.collaboration_needs || ""}`)
        .join(" ");
      return `${member.full_name || ""} ${member.local_chapter || ""} ${member.position || ""} ${member.company_name || ""} ${member.industry || ""} ${businessText}`
        .toLocaleLowerCase()
        .includes(query);
    });
  }, [businessesByUser, keyword, members]);

  async function logSearch() {
    await supabase.from("skill_search_logs").insert({
      user_id: user?.id || null,
      query: keyword || null,
      qualification: null,
      specialty: null,
      service_area: null,
      experience_years: null,
    });
  }

  return (
    <main>
      <PageHero eyebrow="Youth Members" title="会員・事業者一覧" description="青年部員のプロフィールと事業者情報をまとめて確認し、相談相手や取引先を探せます。" />
      <section className="page-content">
        <div className="container">
          <HomeLink />
          <div className="search-panel">
            <div className="search-grid members-search-grid">
              <input aria-label="会員・事業者を検索" placeholder="氏名・所属単会・役職・会社名・業種・事業内容で検索" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              <button className="button" type="button" onClick={logSearch}><Search size={17} /> 検索を記録</button>
            </div>
          </div>
          {loading ? <Loading /> : (
            <div className="member-grid">
              {filtered.map((member) => {
                const relatedBusinesses = businessesByUser.get(member.id) ?? [];
                const primaryBusiness = relatedBusinesses[0];
                return (
                  <Link className="member-card" href={`/members/${member.id}`} key={member.id}>
                    <div className="member-card-heading">
                      <div className="avatar small">
                        {member.avatar_url ? <img src={member.avatar_url} alt="" /> : <UserRound size={25} />}
                      </div>
                      <div>
                        <span className="tag">{member.local_chapter || "所属単会未設定"}</span>
                        <h3>{member.full_name || "氏名未設定"}</h3>
                      </div>
                    </div>
                    <p>{member.position || "役職未設定"}</p>
                    <p>{member.company_name || "会社名未設定"}</p>
                    <p>{member.industry || "業種未設定"}</p>
                    {primaryBusiness && (
                      <div className="member-business-summary">
                        <span>登録事業者</span>
                        <strong>{recordTitle(primaryBusiness)}</strong>
                        <p>{String(primaryBusiness.category || primaryBusiness.area || "事業者情報あり")}</p>
                        {relatedBusinesses.length > 1 && <small>ほか {relatedBusinesses.length - 1}件</small>}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
