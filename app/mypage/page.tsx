"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CircleHelp,
  Handshake,
  Lightbulb,
  Mail,
  Megaphone,
  MessageCircle,
  Pencil,
  Plus,
  Trophy,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { dealStatusLabels } from "@/lib/deals";
import { recordTitle } from "@/lib/records";
import { supabase } from "@/lib/supabase";
import type { BaseRecord, BusinessDeal, Conversation, DirectMessage, MarchePost, Profile } from "@/types";

type PostItem = BaseRecord & {
  itemType: string;
  itemLabel: string;
  detailHref: string;
  editHref: string;
  displayTitle: string;
};

type ConversationNotice = {
  conversation: Conversation;
  partner?: Profile;
  latest?: DirectMessage;
  unreadCount: number;
};

const quickActions = [
  { href: "/businesses/new", label: "事業者を追加", text: "会社・店舗・サービスを複数登録", icon: Building2 },
  { href: "/problems/new", label: "困りごとを相談", text: "課題を共有して仲間に相談", icon: CircleHelp },
  { href: "/collaborations/new", label: "コラボを募集", text: "一緒に取り組む仲間を募集", icon: Handshake },
  { href: "/successes/new", label: "成功事例を投稿", text: "仕事や連携の成果を共有", icon: Trophy },
  { href: "/marche/new", label: "PRを投稿", text: "イベントや事業の情報を発信", icon: Megaphone },
  { href: "/members/me/edit", label: "プロフィール編集", text: "会員情報やスキルを更新", icon: UserRound },
];

const activeDealStatuses = new Set(["started", "in_progress", "quoted", "contracted", "ongoing"]);

export default function MyPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState<BaseRecord[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [notices, setNotices] = useState<ConversationNotice[]>([]);
  const [deals, setDeals] = useState<BusinessDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const [deletingKey, setDeletingKey] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadDashboard() {
      setLoading(true);
      setWarning("");
      const [businessResult, problemResult, collaborationResult, successResult, marcheResult, conversationResult, dealResult] = await Promise.all([
        supabase.from("businesses").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("problems").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("collaborations").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("successes").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("marche_posts").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("conversations").select("*").order("updated_at", { ascending: false }),
        supabase.from("business_deals").select("*").order("updated_at", { ascending: false }),
      ]);

      const failed = [businessResult, problemResult, collaborationResult, successResult, marcheResult, conversationResult, dealResult]
        .filter((result) => result.error);
      if (failed.length) setWarning("一部の情報を取得できませんでした。再読み込みすると解消する場合があります。");

      const ownBusinesses = (businessResult.data as BaseRecord[] | null) ?? [];
      setBusinesses(ownBusinesses);

      const mapPosts = (rows: BaseRecord[] | null, itemType: string, itemLabel: string) =>
        (rows ?? []).map((row) => ({
          ...row,
          itemType,
          itemLabel,
          displayTitle: recordTitle(row),
          detailHref: `/${itemType}/${row.id}`,
          editHref: `/${itemType}/${row.id}/edit`,
        }));
      const marchePosts = ((marcheResult.data as MarchePost[] | null) ?? []).map((row) => ({
        ...row,
        itemType: "marche",
        itemLabel: "PR",
        displayTitle: row.event_name || "名称未設定",
        detailHref: `/marche/${row.id}`,
        editHref: `/marche/${row.id}/edit`,
      }));
      setPosts([
        ...mapPosts(problemResult.data as BaseRecord[] | null, "problems", "困りごと"),
        ...mapPosts(collaborationResult.data as BaseRecord[] | null, "collaborations", "コラボ募集"),
        ...mapPosts(successResult.data as BaseRecord[] | null, "successes", "成功事例"),
        ...marchePosts,
      ].sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""))));
      setDeals((dealResult.data as BusinessDeal[] | null) ?? []);

      const conversations = (conversationResult.data as Conversation[] | null) ?? [];
      if (conversations.length) {
        const conversationIds = conversations.map((conversation) => conversation.id);
        const partnerIds = [...new Set(conversations.map((conversation) =>
          conversation.participant_one === user!.id ? conversation.participant_two : conversation.participant_one,
        ))];
        const [{ data: messageData }, { data: profileData }] = await Promise.all([
          supabase.from("messages").select("*").in("conversation_id", conversationIds).order("created_at", { ascending: false }),
          supabase.from("public_profiles").select("*").in("id", partnerIds),
        ]);
        const messages = (messageData as DirectMessage[] | null) ?? [];
        const profiles = (profileData as Profile[] | null) ?? [];
        setNotices(conversations.map((conversation) => {
          const conversationMessages = messages.filter((message) => message.conversation_id === conversation.id);
          const partnerId = conversation.participant_one === user!.id ? conversation.participant_two : conversation.participant_one;
          return {
            conversation,
            partner: profiles.find((item) => item.id === partnerId),
            latest: conversationMessages[0],
            unreadCount: conversationMessages.filter((message) => message.sender_id !== user!.id && !message.read_at).length,
          };
        }));
      } else {
        setNotices([]);
      }
      setLoading(false);
    }

    loadDashboard();
  }, [user]);

  const unreadCount = notices.reduce((sum, notice) => sum + notice.unreadCount, 0);
  const activeDeals = deals.filter((deal) => activeDealStatuses.has(deal.status)).length;
  const recentPosts = useMemo(() => posts.slice(0, 8), [posts]);
  const unreadNotices = notices.filter((notice) => notice.unreadCount > 0).slice(0, 4);

  async function removeItem(table: string, id: string | number, label: string) {
    if (!window.confirm(`「${label}」を削除します。削除後は元に戻せません。よろしいですか？`)) return;
    const key = `${table}-${id}`;
    setDeletingKey(key);
    setWarning("");
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      setWarning(`削除できませんでした: ${error.message}`);
    } else if (table === "business_deals") {
      setDeals((current) => current.filter((deal) => String(deal.id) !== String(id)));
    } else {
      const itemType = table === "marche_posts" ? "marche" : table;
      setPosts((current) => current.filter((post) => !(post.itemType === itemType && String(post.id) === String(id))));
    }
    setDeletingKey("");
  }

  if (authLoading) return <Loading />;
  if (!user) {
    return (
      <main>
        <PageHero eyebrow="My Page" title="マイページ" description="登録情報、投稿、連絡、商談を一か所で管理できます。" />
        <section className="page-content"><div className="container narrow"><HomeLink /><div className="gate-card"><UserRound size={38} /><h2>ログインが必要です</h2><p>マイページを利用するにはログインしてください。</p><Link className="button" href="/auth">ログイン</Link></div></div></section>
      </main>
    );
  }

  return (
    <main>
      <PageHero
        eyebrow="My Page"
        title="マイページ"
        description="事業者情報、投稿、届いた連絡、商談状況をここから確認・管理できます。"
      />
      <section className="page-content mypage-section">
        <div className="container">
          <HomeLink />
          <div className="mypage-welcome">
            <div>
              <span className="mypage-kicker">WELCOME</span>
              <h2>{profile?.full_name || profile?.company_name || "会員"}さん</h2>
              <p>次にしたいことを選ぶか、届いている連絡と登録内容を確認してください。</p>
            </div>
            <Link className="button secondary" href="/members/me/edit"><Pencil size={16} /> 会員情報を編集</Link>
          </div>

          {warning && <p className="error">{warning}</p>}
          {loading ? <Loading /> : (
            <>
              <div className="mypage-stats">
                <Link href="#businesses"><Building2 /><strong>{businesses.length}</strong><span>登録事業者</span></Link>
                <Link href="#posts"><Lightbulb /><strong>{posts.length}</strong><span>自分の投稿</span></Link>
                <Link className={unreadCount ? "has-alert" : ""} href="/messages"><Mail /><strong>{unreadCount}</strong><span>未読DM</span></Link>
                <Link href="/deals"><BriefcaseBusiness /><strong>{activeDeals}</strong><span>進行中の商談</span></Link>
              </div>

              {unreadCount > 0 && (
                <section className="mypage-inbox-alert">
                  <div className="mypage-section-heading">
                    <div><span className="mypage-kicker">NEW MESSAGE</span><h2>新しい連絡が届いています <span className="mypage-unread-badge">未読 {unreadCount}件</span></h2></div>
                    <Link href="/messages">すべてのDMを見る <ArrowRight size={16} /></Link>
                  </div>
                  <div className="mypage-notice-list">
                    {unreadNotices.map((notice) => (
                      <Link href={`/messages/${notice.conversation.id}`} key={notice.conversation.id}>
                        <span className="mypage-notice-icon"><MessageCircle /></span>
                        <span><strong>{notice.partner?.full_name || notice.partner?.company_name || "青年部員"}</strong><small>{notice.latest?.body || "新しいメッセージがあります"}</small></span>
                        <b>{notice.unreadCount}</b>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="mypage-panel">
                <div className="mypage-section-heading"><div><span className="mypage-kicker">QUICK ACTION</span><h2>登録・投稿する</h2></div></div>
                <div className="mypage-actions">
                  {quickActions.map(({ href, label, text, icon: Icon }) => (
                    <Link href={href} key={href}><span><Icon /></span><div><strong>{label}</strong><small>{text}</small></div><ArrowRight size={17} /></Link>
                  ))}
                </div>
              </section>

              <section className="mypage-panel" id="businesses">
                <div className="mypage-section-heading">
                  <div><span className="mypage-kicker">MY BUSINESSES</span><h2>事業者管理</h2><p>会社、店舗、事業、サービスを複数登録できます。</p></div>
                  <Link className="button" href="/businesses/new"><Plus size={16} /> 事業者を追加</Link>
                </div>
                {businesses.length ? (
                  <div className="mypage-business-list">
                    {businesses.map((business) => (
                      <article key={business.id}>
                        <span className="mypage-business-image">{business.image_url ? <img src={String(business.image_url)} alt="" /> : <Building2 />}</span>
                        <div><span className="tag">{String(business.category || "業種未設定")}</span><h3>{recordTitle(business)}</h3><p>{String(business.area || "地域未設定")}</p></div>
                        <div className="mypage-row-actions"><Link href={`/businesses/${business.id}`}>詳細</Link><Link href={`/businesses/${business.id}/edit`}><Pencil size={15} /> 編集</Link></div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mypage-empty"><Building2 /><div><h3>事業者情報を登録しましょう</h3><p>会社やサービスを登録すると、事業者検索から見つけてもらえます。</p></div><Link className="button" href="/businesses/new">登録する</Link></div>
                )}
              </section>

              <section className="mypage-panel" id="deals">
                <div className="mypage-section-heading">
                  <div><span className="mypage-kicker">MY DEALS</span><h2>商談管理</h2><p>自分が開始した商談は、ここから確認・削除できます。</p></div>
                  <Link className="button secondary" href="/deals">商談一覧を見る</Link>
                </div>
                {deals.length ? (
                  <div className="mypage-post-list">
                    {deals.slice(0, 8).map((deal) => (
                      <article key={deal.id}>
                        <span className={`status ${deal.status}`}>{dealStatusLabels[deal.status]}</span>
                        <div><h3>{deal.title || "商談名未入力"}</h3><time>{new Date(deal.updated_at || deal.created_at).toLocaleDateString("ja-JP")}</time></div>
                        <div className="mypage-row-actions">
                          <Link href={`/deals/${deal.id}`}>詳細</Link>
                          {deal.created_by === user.id && (
                            <button className="mypage-delete-button" type="button" onClick={() => removeItem("business_deals", deal.id, deal.title || "商談名未入力")} disabled={deletingKey === `business_deals-${deal.id}`}>
                              <Trash2 size={15} /> {deletingKey === `business_deals-${deal.id}` ? "削除中" : "削除"}
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <div className="mypage-empty"><BriefcaseBusiness /><div><h3>商談はまだありません</h3><p>投稿詳細やDMから商談を開始できます。</p></div></div>}
              </section>

              <section className="mypage-panel" id="posts">
                <div className="mypage-section-heading"><div><span className="mypage-kicker">MY POSTS</span><h2>自分の投稿</h2><p>最近の投稿をまとめて確認できます。</p></div></div>
                {recentPosts.length ? (
                  <div className="mypage-post-list">
                    {recentPosts.map((post) => (
                      <article key={`${post.itemType}-${post.id}`}>
                        <span className="tag">{post.itemLabel}</span>
                        <div><h3>{post.displayTitle}</h3><time>{post.created_at ? new Date(post.created_at).toLocaleDateString("ja-JP") : ""}</time></div>
                        <div className="mypage-row-actions">
                          <Link href={post.detailHref}>詳細</Link>
                          <Link href={post.editHref}><Pencil size={15} /> 編集</Link>
                          <button className="mypage-delete-button" type="button" onClick={() => removeItem(post.itemType === "marche" ? "marche_posts" : post.itemType, post.id, post.displayTitle)} disabled={deletingKey === `${post.itemType === "marche" ? "marche_posts" : post.itemType}-${post.id}`}>
                            <Trash2 size={15} /> {deletingKey === `${post.itemType === "marche" ? "marche_posts" : post.itemType}-${post.id}` ? "削除中" : "削除"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <div className="mypage-empty"><Lightbulb /><div><h3>投稿はまだありません</h3><p>上の「登録・投稿する」から目的に合う項目を選べます。</p></div></div>}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
