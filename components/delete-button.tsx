"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth-provider";

export function DeleteButton({
  table,
  id,
  redirect,
}: {
  table: string;
  id: string;
  redirect: string;
}) {
  const router = useRouter();
  const { isApproved, isAdmin } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!isApproved && !isAdmin) {
      setError("管理者承認後に削除できます。");
      return;
    }
    if (!window.confirm("このデータを削除します。よろしいですか？")) return;
    setDeleting(true);
    const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <>
      {error && <p className="error">{error}</p>}
      <button className="button danger" type="button" onClick={remove} disabled={deleting}>
        <Trash2 size={16} /> {deleting ? "削除中..." : "削除する"}
      </button>
    </>
  );
}
