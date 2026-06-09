"use client";

import { MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApprovalGate } from "@/components/approval-gate";
import { useAuth } from "@/components/auth-provider";
import { HomeLink, Loading, PageHero } from "@/components/ui";
import { formatDate } from "@/lib/records";
import { supabase } from "@/lib/supabase";
import type { Conversation, DirectMessage, Profile } from "@/types";

type ConversationView = Conversation & { partner?: Profile; latest?: DirectMessage };

export default function MessagesPage() {
  const { user, isApproved } = useAuth();
  const [items, setItems] = useState<ConversationView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isApproved) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase.from("conversations").select("*").order("updated_at", { ascending: false });
      const conversations = (data as Conversation[]) ?? [];
      const partnerIds = conversations.map((item) => item.participant_one === user!.id ? item.participant_two : item.participant_one);
      const [{ data: profiles }, { data: messages }] = await Promise.all([
        partnerIds.length ? supabase.from("public_profiles").select("*").in("id", partnerIds) : Promise.resolve({ data: [] }),
        conversations.length ? supabase.from("messages").select("*").in("conversation_id", conversations.map((item) => item.id)).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
      ]);
      const profileMap = new Map(((profiles as Profile[]) ?? []).map((profile) => [profile.id, profile]));
      const latestMap = new Map<string, DirectMessage>();
      for (const message of (messages as DirectMessage[]) ?? []) if (!latestMap.has(message.conversation_id)) latestMap.set(message.conversation_id, message);
      setItems(conversations.map((conversation) => ({
        ...conversation,
        partner: profileMap.get(conversation.participant_one === user!.id ? conversation.participant_two : conversation.participant_one),
        latest: latestMap.get(conversation.id),
      })));
      setLoading(false);
    }
    load();
  }, [isApproved, user]);

  return (
    <main>
      <PageHero eyebrow="Direct Messages" title="DM" description="承認済みの青年部員同士で、仕事や連携について安全に相談できます。" />
      <section className="page-content">
        <div className="container">
          <HomeLink />
          <ApprovalGate action="DM">
            <div className="messages-shell">
              <div className="toolbar"><h2>会話一覧</h2></div>
              {loading ? <Loading /> : items.length ? items.map((item) => (
                <Link className="conversation-row" href={`/messages/${item.id}`} key={item.id}>
                  <div className="avatar small">
                    {item.partner?.avatar_url ? <img src={item.partner.avatar_url} alt="" /> : <UserRound size={24} />}
                  </div>
                  <div className="conversation-main">
                    <strong>{item.partner?.full_name || "青年部員"}</strong>
                    <p>{item.latest?.body || "会話を始めましょう"}</p>
                  </div>
                  <time>{item.latest ? formatDate(item.latest.created_at) : ""}</time>
                </Link>
              )) : (
                <div className="state-box"><MessageCircle /><p>会話はまだありません。会員や投稿の詳細からDMを開始できます。</p></div>
              )}
            </div>
          </ApprovalGate>
        </div>
      </section>
    </main>
  );
}
