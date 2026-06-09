"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

export function LikeButton({
  targetType,
  targetId,
  ownerId,
  initialCount,
  compact = false,
}: {
  targetType: string;
  targetId: string;
  ownerId?: string | null;
  initialCount?: number;
  compact?: boolean;
}) {
  const { user, isApproved } = useAuth();
  const [count, setCount] = useState(initialCount ?? 0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(initialCount === undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const countQuery = supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("target_type", targetType)
        .eq("target_id", targetId);
      const ownQuery = user
        ? supabase
            .from("likes")
            .select("id")
            .eq("target_type", targetType)
            .eq("target_id", targetId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null });
      const [countResult, ownResult] = await Promise.all([countQuery, ownQuery]);
      if (!active) return;
      if (initialCount === undefined) setCount(countResult.count ?? 0);
      setLiked(Boolean(ownResult.data));
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [initialCount, targetId, targetType, user]);

  async function toggle() {
    setError("");
    if (!user) {
      setError("ログイン後にいいねできます。");
      return;
    }
    if (!isApproved) {
      setError("管理者承認後にいいねできます。");
      return;
    }
    setLoading(true);
    if (liked) {
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId);
      if (deleteError) setError(deleteError.message);
      else {
        setLiked(false);
        setCount((value) => Math.max(0, value - 1));
      }
    } else {
      const { error: insertError } = await supabase.from("likes").insert({
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        target_owner_id: ownerId || null,
      });
      if (insertError) setError(insertError.message);
      else {
        setLiked(true);
        setCount((value) => value + 1);
      }
    }
    setLoading(false);
  }

  return (
    <span className={compact ? "like-wrap compact" : "like-wrap"}>
      <button
        className={liked ? "like-button liked" : "like-button"}
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-label={liked ? "いいねを解除" : "いいね"}
      >
        <Heart size={compact ? 15 : 18} fill={liked ? "currentColor" : "none"} />
        <span>{count}</span>
      </button>
      {error && !compact && <small className="inline-error">{error}</small>}
    </span>
  );
}
