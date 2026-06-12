"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { recordDescription, recordTitle } from "@/lib/records";
import { fetchPostAuthors } from "@/lib/post-authors";
import { supabase } from "@/lib/supabase";
import type { BaseRecord, PostAuthor, ResourceConfig } from "@/types";
import { Empty, Loading } from "./ui";
import { ResourceCard } from "./resource-card";
import { paginate, Pagination } from "./pagination";

export function ResourceList({ config }: { config: ResourceConfig }) {
  const [items, setItems] = useState<BaseRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [authors, setAuthors] = useState<Record<string, PostAuthor>>({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Promise.all([
      supabase.from(config.table).select("*").eq("approval_status", "approved").order("created_at", { ascending: false }),
      supabase.from("likes").select("target_id").eq("target_type", config.table),
    ]).then(async ([{ data, error: fetchError }, likesResult]) => {
        if (fetchError) setError(fetchError.message);
        const loadedItems = (data as BaseRecord[]) ?? [];
        setItems(loadedItems);
        const counts: Record<string, number> = {};
        for (const like of likesResult.data ?? []) counts[like.target_id] = (counts[like.target_id] ?? 0) + 1;
        setLikeCounts(counts);
        try {
          const authorMap = await fetchPostAuthors(loadedItems.map((item) => item.user_id));
          setAuthors(Object.fromEntries(authorMap));
        } catch {
          setAuthors({});
        }
        setLoading(false);
      });
  }, [config.table]);

  const filtered = useMemo(() => {
    const query = keyword.toLocaleLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      `${recordTitle(item)} ${recordDescription(item)} ${item.category || ""} ${item.area || ""}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [items, keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, config.table]);

  const pageItems = useMemo(
    () => paginate(filtered, currentPage),
    [currentPage, filtered],
  );

  return (
    <>
      <div className="search-panel">
        <div className="search-grid" style={{ gridTemplateColumns: "1fr auto" }}>
          <input
            aria-label={`${config.label}を検索`}
            placeholder="タイトル・内容・地域で検索"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <button className="button" type="button"><Search size={18} /> 検索</button>
        </div>
      </div>
      {error && <p className="error">データを取得できませんでした: {error}</p>}
      {loading ? <Loading /> : (
        <>
          <p className="list-count">{filtered.length}件中 {filtered.length ? (currentPage - 1) * 20 + 1 : 0}〜{Math.min(currentPage * 20, filtered.length)}件を表示</p>
          <div className="card-grid">
            {pageItems.length
              ? pageItems.map((item) => (
                  <ResourceCard
                    author={item.user_id ? authors[item.user_id] : undefined}
                    config={config}
                    item={item}
                    likeCount={likeCounts[String(item.id)] ?? 0}
                    key={item.id}
                  />
                ))
              : <Empty text={`登録されている${config.label}はまだありません。`} />}
          </div>
          <Pagination currentPage={currentPage} totalItems={filtered.length} onPageChange={setCurrentPage} />
        </>
      )}
    </>
  );
}
