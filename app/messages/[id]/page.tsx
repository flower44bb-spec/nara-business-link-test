"use client";

import { FormEvent, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { useParams } from "next/navigation";
import { ApprovalGate } from "@/components/approval-gate";
import { useAuth } from "@/components/auth-provider";
import { BackLink, Loading, PageHero } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { Conversation, DirectMessage, Profile } from "@/types";

export default function MessageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isApproved } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!user || !isApproved) return;
    const { data: conversationData, error: conversationError } = await supabase.from("conversations").select("*").eq("id", id).single();
    if (conversationError || !conversationData) {
      setError("この会話を表示できません。");
      setLoading(false);
      return;
    }
    const current = conversationData as Conversation;
    setConversation(current);
    const partnerId = current.participant_one === user.id ? current.participant_two : current.participant_one;
    const [{ data: profileData }, { data: messageData }] = await Promise.all([
      supabase.from("public_profiles").select("*").eq("id", partnerId).single(),
      supabase.from("messages").select("*").eq("conversation_id", id).order("created_at"),
    ]);
    setPartner(profileData as Profile);
    setMessages((messageData as DirectMessage[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id, isApproved, user]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!user || !conversation || !body.trim()) return;
    setSending(true);
    const { error: sendError } = await supabase.from("messages").insert({
      conversation_id: conversation.id, sender_id: user.id, body: body.trim(),
    });
    if (sendError) setError(sendError.message);
    else {
      setBody("");
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation.id);
      await load();
    }
    setSending(false);
  }

  return (
    <main>
      <PageHero eyebrow="Conversation" title={partner?.full_name || "DM"} description="会話内容は参加している2名だけが閲覧できます。" />
      <section className="page-content">
        <div className="container narrow">
          <BackLink href="/messages" />
          <ApprovalGate action="DM">
            {loading ? <Loading /> : (
              <div className="chat-panel">
                {error && <p className="error">{error}</p>}
                <div className="message-list">
                  {messages.map((message) => (
                    <div className={message.sender_id === user?.id ? "message-bubble mine" : "message-bubble"} key={message.id}>
                      <p>{message.body}</p>
                      <time>{new Date(message.created_at).toLocaleString("ja-JP")}</time>
                    </div>
                  ))}
                </div>
                <form className="message-form" onSubmit={send}>
                  <textarea aria-label="メッセージ" value={body} onChange={(e) => setBody(e.target.value)} placeholder="メッセージを入力" required />
                  <button className="button" type="submit" disabled={sending}><Send size={17} /> 送信</button>
                </form>
              </div>
            )}
          </ApprovalGate>
        </div>
      </section>
    </main>
  );
}
