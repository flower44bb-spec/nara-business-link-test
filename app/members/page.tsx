"use client";

import { Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [keyword, setKeyword] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
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
      `${member.full_name || ""} ${member.company_name || ""} ${member.industry || ""} ${member.local_chapter || ""} ${member.website_url || ""} ${member.sns_url || ""} ${member.available_work || ""} ${(member.qualifications || []).join(" ")} ${(member.specialties || []).join(" ")} ${(member.service_areas || []).join(" ")}`
        .toLocaleLowerCase().includes(query)
      && (!qualification || (member.qualifications || []).includes(qualification))
      && (!specialty || (member.specialties || []).includes(specialty))
      && (!serviceArea || (member.service_areas || []).includes(serviceArea))
      && (!experienceYears || member.experience_years === experienceYears),
    );
  }, [experienceYears, keyword, members, qualification, serviceArea, specialty]);

  const qualifications = useMemo(() => uniqueTags(members.flatMap((member) => member.qualifications || [])), [members]);
  const specialties = useMemo(() => uniqueTags(members.flatMap((member) => member.specialties || [])), [members]);
  const serviceAreas = useMemo(() => uniqueTags(members.flatMap((member) => member.service_areas || [])), [members]);

  async function logSearch() {
    await supabase.from("skill_search_logs").insert({
      user_id: user?.id || null,
      query: keyword || null,
      qualification: qualification || null,
      specialty: specialty || null,
      service_area: serviceArea || null,
      experience_years: experienceYears || null,
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
              <input aria-label="青年部員を検索" placeholder="氏名・会社名・業種・所属単会・対応業務で検索" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              <select aria-label="資格" value={qualification} onChange={(e) => setQualification(e.target.value)}>
                <option value="">資格すべて</option>
                {qualifications.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
              <select aria-label="得意分野" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                <option value="">得意分野すべて</option>
                {specialties.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
              <select aria-label="対応エリア" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)}>
                <option value="">対応エリアすべて</option>
                {serviceAreas.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
              <select aria-label="経験年数" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}>
                <option value="">経験年数すべて</option>
                {["1年未満", "1〜3年", "3〜5年", "5〜10年", "10年以上"].map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
              <button className="button" type="button" onClick={logSearch}><Search size={17} /> 検索を記録</button>
            </div>
          </div>
          {loading ? <Loading /> : (
            <div className="member-grid">
              {filtered.map((member) => (
                <Link className="member-card" href={`/members/${member.id}`} key={member.id}>
                  <div className="avatar">
                    {member.avatar_url ? <img src={member.avatar_url} alt="" /> : <UserRound size={32} />}
                  </div>
                  <div>
                    <span className="tag">{member.local_chapter || "所属単会未設定"}</span>
                    <h3>{member.full_name || "氏名未設定"}</h3>
                    <p>{member.company_name || "会社名未設定"} / {member.industry || "業種未設定"}</p>
                    <ChipList values={[...(member.qualifications || []), ...(member.specialties || [])].slice(0, 5)} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function uniqueTags(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ja"));
}

function ChipList({ values }: { values: string[] }) {
  if (!values.length) return null;
  return <div className="chip-list">{values.map((value) => <span className="chip" key={value}>{value}</span>)}</div>;
}
