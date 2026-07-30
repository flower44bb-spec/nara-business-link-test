"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    supabase.from("public_profiles").select("*").order("full_name")
      .then(({ data }) => {
        setMembers((data as Profile[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const query = keyword.toLocaleLowerCase();
    return members.filter((member) =>
      `${member.full_name || ""} ${member.local_chapter || ""} ${member.position || ""} ${member.company_name || ""} ${member.industry || ""}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [keyword, members]);

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
      <PageHero eyebrow="Youth Members" title="青年部員一覧" description="奈良県内の青年部員の経験や得意分野から、相談できる仲間を探せます。" />
      <section className="page-content">
        <div className="container">
          <HomeLink />
          <div className="search-panel">
            <div className="search-grid members-search-grid">
              <input aria-label="青年部員を検索" placeholder="氏名・所属単会・役職・会社名・業種で検索" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              <button className="button" type="button" onClick={logSearch}><Search size={17} /> 検索を記録</button>
            </div>
          </div>
          {loading ? <Loading /> : (
            <div className="member-grid">
              {filtered.map((member) => (
                <Link className="member-card" href={`/members/${member.id}`} key={member.id}>
                  <span className="tag">{member.local_chapter || "所属単会未設定"}</span>
                  <h3>{member.full_name || "氏名未設定"}</h3>
                  <p>{member.position || "役職未設定"}</p>
                  <p>{member.company_name || "会社名未設定"}</p>
                  <p>{member.industry || "業種未設定"}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
