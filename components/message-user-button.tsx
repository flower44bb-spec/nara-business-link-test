"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

export function MessageUserButton({ recipientId }: { recipientId?: string | null }) {
  const router = useRouter();
  const { user, isApproved } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!recipientId || recipientId === user?.id) return null;

  async function startConversation() {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (!isApproved) {
      setError("管理者承認後にDMを利用できます。");
      return;
    }
    setLoading(true);
    setError("");
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_one.eq.${user.id},participant_two.eq.${recipientId}),and(participant_one.eq.${recipientId},participant_two.eq.${user.id})`,
      )
      .maybeSingle();

    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }
    const { data, error: insertError } = await supabase
      .from("conversations")
      .insert({ participant_one: user.id, participant_two: recipientId })
      .select("id")
      .single();
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    router.push(`/messages/${data.id}`);
  }

  return (
    <>
      <button className="button" type="button" onClick={startConversation} disabled={loading}>
        <MessageCircle size={17} /> {loading ? "準備中..." : "DMを送る"}
      </button>
      {error && <p className="inline-error">{error}</p>}
    </>
  );
}
