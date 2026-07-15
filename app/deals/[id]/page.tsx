"use client";

import { ArrowRight, BriefcaseBusiness, Save } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApprovalGate } from "@/components/approval-gate";
import { useAuth } from "@/components/auth-provider";
import { BackLink, Empty, Loading, PageHero } from "@/components/ui";
import { dealStatusLabels, dealStatusOptions, formatDealAmount, isContractedDeal } from "@/lib/deals";
import { supabase } from "@/lib/supabase";
import type { BusinessDeal, DealStatus, Profile } from "@/types";

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isApproved, isAdmin } = useAuth();
  const [deal, setDeal] = useState<BusinessDeal | null>(null);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [status, setStatus] = useState<DealStatus>("started");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [introducerId, setIntroducerId] = useState("");
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!user || !isApproved) return;
    setLoading(true);
    const { data, error: fetchError } = await supabase.from("business_deals").select("*").eq("id", id).single();
    if (fetchError || !data) {
      setError(fetchError?.message || "商談を取得できませんでした。");
      setLoading(false);
      return;
    }
    const loadedDeal = data as BusinessDeal;
    setDeal(loadedDeal);
    setStatus(loadedDeal.status);
    setAmount(loadedDeal.amount == null ? "" : String(loadedDeal.amount));
    setComment(loadedDeal.comment || "");
    setIntroducerId(loadedDeal.introducer_id || "");

    const ids = [loadedDeal.requester_id, loadedDeal.contractor_id, loadedDeal.introducer_id].filter(Boolean) as string[];
    const [{ data: profileData }, { data: memberData }] = await Promise.all([
      ids.length ? supabase.from("public_profiles").select("*").in("id", ids) : Promise.resolve({ data: [] }),
      supabase.from("public_profiles").select("*").order("full_name"),
    ]);
    setProfiles(new Map(((profileData as Profile[]) ?? []).map((profile) => [profile.id, profile])));
    setMembers((memberData as Profile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id, isApproved, user]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!deal) return;
    setSaving(true);
    setMessage("");
    setError("");
    const { data, error: updateError } = await supabase
      .from("business_deals")
      .update({
        status,
        amount: amount ? Number(amount) : null,
        comment,
        introducer_id: introducerId || null,
      })
      .eq("id", deal.id)
      .select("*")
      .single();
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDeal(data as BusinessDeal);
    setMessage("商談情報を保存しました。");
  }

  const requester = deal ? profiles.get(deal.requester_id) : undefined;
  const contractor = deal ? profiles.get(deal.contractor_id) : undefined;
  const introducer = deal?.introducer_id ? profiles.get(deal.introducer_id) : undefined;
  const canEdit = Boolean(deal && user && (isAdmin || deal.requester_id === user.id || deal.contractor_id === user.id || deal.introducer_id === user.id));

  return (
    <main>
      <PageHero eyebrow="Deal Progress" title="商談詳細" description="商談開始から成約、継続取引、終了までの流れを記録します。" />
      <section className="page-content">
        <div className="container">
          <BackLink href="/deals" />
          <ApprovalGate action="商談管理">
            {loading ? <Loading /> : error || !deal ? <Empty text={`商談を表示できません。${error}`} /> : (
              <div className="detail-layout">
                <article className="detail-card">
                  <span className={`status ${deal.status}`}>{dealStatusLabels[deal.status]}</span>
                  <h1>{deal.title}</h1>
                  <p className="detail-description">{deal.description || "商談内容は未入力です。"}</p>
                  <dl className="detail-list">
                    <div className="detail-row"><dt>依頼者</dt><dd>{displayProfile(requester)}</dd></div>
                    <div className="detail-row"><dt>受注者</dt><dd>{displayProfile(contractor)}</dd></div>
                    <div className="detail-row"><dt>紹介者</dt><dd>{displayProfile(introducer) || "未設定"}</dd></div>
                    <div className="detail-row"><dt>カテゴリ</dt><dd>{deal.category || "未設定"}</dd></div>
                    <div className="detail-row"><dt>地域</dt><dd>{deal.area || "未設定"}</dd></div>
                    <div className="detail-row"><dt>取引金額</dt><dd>{formatDealAmount(deal.amount)}</dd></div>
                    <div className="detail-row"><dt>コメント</dt><dd>{deal.comment || "未入力"}</dd></div>
                    {deal.source_type && deal.source_id && (
                      <div className="detail-row">
                        <dt>関連投稿</dt>
                        <dd><Link href={sourceHref(deal)}>元になった投稿を見る</Link></dd>
                      </div>
                    )}
                    {deal.success_id && (
                      <div className="detail-row">
                        <dt>成功事例</dt>
                        <dd><Link href={`/successes/${deal.success_id}`}>登録済みの成功事例を見る</Link></dd>
                      </div>
                    )}
                  </dl>
                </article>
                <aside className="side-card">
                  <BriefcaseBusiness size={30} />
                  <h3>商談を進める</h3>
                  {message && <p className="notice">{message}</p>}
                  {error && <p className="error">{error}</p>}
                  {canEdit && (
                    <form className="compact-form" onSubmit={submit}>
                      <div className="field">
                        <label htmlFor="deal_status">状態</label>
                        <select id="deal_status" value={status} onChange={(e) => setStatus(e.target.value as DealStatus)}>
                          {dealStatusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor="deal_amount">取引金額</label>
                        <input id="deal_amount" type="number" min="0" step="1" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="例：500000" />
                      </div>
                      <div className="field">
                        <label htmlFor="deal_introducer">紹介者</label>
                        <select id="deal_introducer" value={introducerId} onChange={(e) => setIntroducerId(e.target.value)}>
                          <option value="">未設定</option>
                          {members.map((member) => <option value={member.id} key={member.id}>{member.full_name || member.company_name || "氏名未設定"}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor="deal_comment">コメント</label>
                        <textarea id="deal_comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="商談状況、次回対応、補足事項など" />
                      </div>
                      <button className="button" type="submit" disabled={saving}><Save size={16} /> {saving ? "保存中..." : "保存する"}</button>
                    </form>
                  )}
                  {isContractedDeal(deal.status) && (
                    <Link className="button secondary" href={`/successes/new?deal_id=${deal.id}`}>
                      成功事例として登録 <ArrowRight size={16} />
                    </Link>
                  )}
                </aside>
              </div>
            )}
          </ApprovalGate>
        </div>
      </section>
    </main>
  );
}

function displayProfile(profile?: Profile) {
  if (!profile) return "";
  return `${profile.full_name || "氏名未設定"} / ${profile.company_name || "会社名未設定"}`;
}

function sourceHref(deal: BusinessDeal) {
  const path = deal.source_type === "marche_posts" ? "marche" : deal.source_type;
  return `/${path}/${deal.source_id}`;
}
