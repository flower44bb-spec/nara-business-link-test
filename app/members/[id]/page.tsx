"use client";

import { Building2, ExternalLink, MapPin, Pencil, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { MessageUserButton } from "@/components/message-user-button";
import { BackLink, Empty, Loading, PageHero } from "@/components/ui";
import { hasProfileItemMarkers, normalizeProfileItems } from "@/lib/profile-text";
import { recordDescription, recordTitle } from "@/lib/records";
import { supabase } from "@/lib/supabase";
import type { BaseRecord, Profile } from "@/types";

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [member, setMember] = useState<Profile | null>(null);
  const [businesses, setBusinesses] = useState<BaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMember() {
      const [{ data }, businessesResult] = await Promise.all([
        supabase.from("public_profiles").select("*").eq("id", id).single(),
        loadMemberBusinesses(id),
      ]);
      setMember(data as Profile | null);
      setBusinesses((businessesResult.data as BaseRecord[]) ?? []);
      setLoading(false);
    }
    loadMember();
  }, [id, isAdmin, user?.id]);

  return (
    <main>
      <PageHero eyebrow="Member Profile" title="青年部員プロフィール" description="得意分野や相談できることを知り、地域の仲間とつながりましょう。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/members" />
          {loading ? <Loading /> : !member ? <Empty text="プロフィールが見つかりません。" /> : (
            <div className="detail-layout">
              <article className="detail-card profile-detail">
                <div className="profile-heading">
                  <div className="avatar large">
                    {member.avatar_url ? <img src={member.avatar_url} alt="" /> : <UserRound size={55} />}
                  </div>
                  <div>
                    <span className="tag">{member.local_chapter || "所属単会未設定"}</span>
                    <h1>{member.full_name || "氏名未設定"}</h1>
                    <p>{member.position || "役職未設定"}</p>
                  </div>
                </div>
                <dl className="detail-list">
                  <div className="detail-row"><dt>会社名</dt><dd>{member.company_name || "未設定"}</dd></div>
                  <div className="detail-row"><dt>業種</dt><dd>{member.industry || "未設定"}</dd></div>
                  <div className="detail-row"><dt>自己紹介</dt><dd><ProfileText value={member.bio} /></dd></div>
                  <div className="detail-row"><dt>相談できること</dt><dd><ProfileText value={member.can_help_with} /></dd></div>
                  <div className="detail-row"><dt>つながりたい業種</dt><dd><ProfileText value={member.wants_to_connect_with} /></dd></div>
                  <div className="detail-row"><dt>保有資格</dt><dd><ChipList values={member.qualifications || []} /></dd></div>
                  <div className="detail-row"><dt>得意分野</dt><dd><SpecialtyList values={member.specialties || []} /></dd></div>
                  <div className="detail-row"><dt>対応可能業務</dt><dd><ProfileText value={member.available_work} /></dd></div>
                  <div className="detail-row"><dt>対応エリア</dt><dd><ChipList values={member.service_areas || []} /></dd></div>
                  <div className="detail-row"><dt>経験年数</dt><dd>{member.experience_years || "未設定"}</dd></div>
                  <div className="detail-row"><dt>SNS</dt><dd><ProfileLink url={member.sns_url} label="SNSを開く" /></dd></div>
                  <div className="detail-row"><dt>ホームページ</dt><dd><ProfileLink url={member.homepage_url} label="ホームページを開く" /></dd></div>
                  <div className="detail-row"><dt>Instagram</dt><dd><ProfileLink url={member.instagram_url} label="Instagramを開く" /></dd></div>
                  <div className="detail-row"><dt>Facebook</dt><dd><ProfileLink url={member.facebook_url} label="Facebookを開く" /></dd></div>
                  <div className="detail-row"><dt>X</dt><dd><ProfileLink url={member.x_url} label="Xを開く" /></dd></div>
                  <div className="detail-row"><dt>その他SNS</dt><dd><ProfileLink url={member.other_sns_url} label="SNSを開く" /></dd></div>
                </dl>
                <h2 className="detail-subheading">事業者情報</h2>
                {businesses.length ? (
                  <div className="linked-business-list">
                    {businesses.map((business) => (
                      <Link className="linked-business-card" href={`/businesses/${business.id}`} key={business.id}>
                        {business.image_url ? (
                          <img
                            className="linked-business-image"
                            src={`${business.image_url}${business.image_url.includes("?") ? "&" : "?"}v=${encodeURIComponent(String(business.updated_at || business.image_url))}`}
                            alt={recordTitle(business)}
                          />
                        ) : (
                          <div className="linked-business-image placeholder"><Building2 size={28} /></div>
                        )}
                        <div>
                          <span className="tag">{String(business.category || "業種未設定")}</span>
                          <h3>{recordTitle(business)}</h3>
                          <p className="linked-business-meta"><MapPin size={14} /> {String(business.area || "地域未設定")}</p>
                          <p className="summary">{recordDescription(business).slice(0, 110)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="empty-inline">登録事業者情報はありません。</p>
                )}
              </article>
              <aside className="side-card">
                <h3>この会員とつながる</h3>
                <p className="summary">仕事や連携について、サイト内DMで直接相談できます。</p>
                <p className="summary"><strong>この会員に相談する</strong></p>
                <MessageUserButton recipientId={member.id} />
                {user?.id === member.id && (
                  <>
                    <Link className="button secondary" href="/members/me/edit"><Pencil size={16} /> プロフィール編集</Link>
                    <Link className="button secondary" href="/businesses/new"><Plus size={16} /> 事業者情報を追加</Link>
                  </>
                )}
              </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function loadMemberBusinesses(memberId: string) {
  return supabase
    .from("businesses")
    .select("*")
    .eq("user_id", memberId)
    .order("created_at", { ascending: false });
}

function ProfileLink({ url, label }: { url?: string | null; label: string }) {
  const safeUrl = normalizeExternalUrl(url);
  if (!url) return "未設定";
  if (!safeUrl) return <span>{url}</span>;

  return (
    <a className="text-link inline-link" href={safeUrl} rel="noreferrer" target="_blank">
      <ExternalLink size={15} /> {label}
    </a>
  );
}

function normalizeExternalUrl(url?: string | null) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function ChipList({ values }: { values: string[] }) {
  if (!values.length) return "未設定";
  return <div className="chip-list">{values.map((value) => <span className="chip" key={value}>{value}</span>)}</div>;
}

function SpecialtyList({ values }: { values: string[] }) {
  if (!values.length) return "未設定";
  const hasBulletItems = hasProfileItemMarkers(values);
  if (!hasBulletItems) return <ChipList values={values} />;

  const lines = normalizeProfileItems(values);
  if (!lines.length) return "未設定";
  return <div className="profile-text">{lines.map((line) => <p className="profile-text-item" key={line}>{line}</p>)}</div>;
}

function ProfileText({ value }: { value?: string | null }) {
  const lines = normalizeProfileText(value);
  if (!lines.length) return "未設定";
  return <div className="profile-text">{lines.map((line) => <p className="profile-text-item" key={line}>{line}</p>)}</div>;
}

function normalizeProfileText(value?: string | null) {
  if (!value) return [];
  return normalizeProfileItems([value]);
}
