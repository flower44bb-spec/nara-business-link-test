"use client";

import { Handshake } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

type DealStartButtonProps = {
  contractorId?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  title?: string | null;
  category?: string | null;
  area?: string | null;
  description?: string | null;
  buttonLabel?: string;
  className?: string;
};

export function DealStartButton({
  contractorId,
  sourceType,
  sourceId,
  title,
  category,
  area,
  description,
  buttonLabel = "商談開始",
  className = "button",
}: DealStartButtonProps) {
  const router = useRouter();
  const { user, isApproved } = useAuth();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  async function startDeal() {
    setError("");
    if (!user || !isApproved) {
      router.push("/auth");
      return;
    }
    if (!contractorId) {
      setError("相手会員を確認できないため、商談を開始できません。");
      return;
    }
    if (contractorId === user.id) {
      setError("自分の投稿には商談を開始できません。相手会員の投稿から開始してください。");
      return;
    }

    setStarting(true);
    const { data, error: insertError } = await supabase
      .from("business_deals")
      .insert({
        created_by: user.id,
        requester_id: user.id,
        contractor_id: contractorId,
        source_type: sourceType,
        source_id: sourceId,
        title: title || "新しい商談",
        category,
        area,
        description,
        status: "started",
      })
      .select("id")
      .single();

    setStarting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.push(`/deals/${data.id}`);
  }

  return (
    <>
      <button className={className} type="button" onClick={startDeal} disabled={starting}>
        <Handshake size={16} /> {starting ? "開始中..." : buttonLabel}
      </button>
      {error && <p className="inline-error">{error}</p>}
    </>
  );
}
