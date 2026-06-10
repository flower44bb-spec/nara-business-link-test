"use client";

import { Building2, CircleCheckBig, Handshake, JapaneseYen } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Stats = {
  businesses: number;
  collaborations: number;
  resolvedProblems: number;
  transactionAmount: number;
};

const initialStats: Stats = {
  businesses: 0,
  collaborations: 0,
  resolvedProblems: 0,
  transactionAmount: 0,
};

export function HomeStats() {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    async function load() {
      const [businesses, collaborations, problems, successes] = await Promise.all([
        supabase
          .from("businesses")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "approved"),
        supabase
          .from("collaborations")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "approved")
          .eq("collaboration_status", "successful"),
        supabase
          .from("problems")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "approved")
          .not("resolved_at", "is", null),
        supabase
          .from("successes")
          .select("transaction_amount")
          .eq("approval_status", "approved")
          .not("transaction_amount", "is", null),
      ]);

      const transactionAmount = (successes.data ?? []).reduce(
        (total, item) => total + Number(item.transaction_amount || 0),
        0,
      );

      setStats({
        businesses: businesses.count ?? 0,
        collaborations: collaborations.count ?? 0,
        resolvedProblems: problems.count ?? 0,
        transactionAmount,
      });
    }

    load();
  }, []);

  const items = [
    { label: "登録事業者数", value: `${stats.businesses.toLocaleString("ja-JP")}社`, icon: Building2 },
    { label: "コラボ成功件数", value: `${stats.collaborations.toLocaleString("ja-JP")}件`, icon: Handshake },
    { label: "困りごと解決件数", value: `${stats.resolvedProblems.toLocaleString("ja-JP")}件`, icon: CircleCheckBig },
    { label: "総取引金額", value: `${stats.transactionAmount.toLocaleString("ja-JP")}円`, icon: JapaneseYen },
  ];

  return (
    <section className="stats-section" aria-label="活動実績">
      <div className="container">
        <div className="stats-grid">
          {items.map(({ label, value, icon: Icon }) => (
            <div className="stat-card" key={label}>
              <span className="stat-icon"><Icon size={22} /></span>
              <div>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="stats-note">管理者承認済みの登録・実績を集計しています。</p>
      </div>
    </section>
  );
}
