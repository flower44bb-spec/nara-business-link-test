"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { recordDescription, recordTitle } from "@/lib/records";
import { fetchPostAuthors } from "@/lib/post-authors";
import { sortFeaturedFirst } from "@/lib/featured-sort";
import type { BaseRecord, PostAuthor } from "@/types";
import { BusinessCard } from "./business-card";
import { Empty, Loading } from "./ui";
import { paginate, Pagination } from "./pagination";

export function BusinessList() {
  const [businesses, setBusinesses] = useState<BaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [area, setArea] = useState("");
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [authors, setAuthors] = useState<Record<string, PostAuthor>>({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    Promise.all([
      supabase.from("businesses").select("*").eq("approval_status", "approved").order("created_at", { ascending: false }),
      supabase.from("likes").select("target_id").eq("target_type", "businesses"),
    ]).then(async ([{ data, error: fetchError }, likesResult]) => {
        if (fetchError) setError(fetchError.message);
        const loadedBusinesses = sortFeaturedFirst((data as BaseRecord[]) ?? []);
        setBusinesses(loadedBusinesses);
        const counts: Record<string, number> = {};
        for (const like of likesResult.data ?? []) counts[like.target_id] = (counts[like.target_id] ?? 0) + 1;
        setLikeCounts(counts);
        try {
          const authorMap = await fetchPostAuthors(loadedBusinesses.map((item) => item.user_id));
          setAuthors(Object.fromEntries(authorMap));
        } catch {
          setAuthors({});
        }
        setLoading(false);
      });
  }, []);

  const categories = useMemo(
    () => [...new Set(businesses.map((item) => String(item.category || "")).filter(Boolean))],
    [businesses],
  );
  const areas = useMemo(
    () => [...new Set(businesses.map((item) => String(item.area || "")).filter(Boolean))],
    [businesses],
  );
  const filtered = useMemo(() => {
    const query = keyword.toLocaleLowerCase();
    return businesses.filter((item) => {
      const text = `${recordTitle(item)} ${recordDescription(item)} ${item.services || ""}`.toLocaleLowerCase();
      return (
        (!query || text.includes(query)) &&
        (!category || item.category === category) &&
        (!area || item.area === area)
      );
    });
  }, [area, businesses, category, keyword]);

  useEffect(() => {
    setCurrentPage(1);
  }, [area, category, keyword]);

  const pageBusinesses = useMemo(
    () => paginate(filtered, currentPage),
    [currentPage, filtered],
  );

  return (
    <>
      <div className="search-panel">
        <div className="search-grid">
          <input
            aria-label="キーワード検索"
            placeholder="会社名・事業内容・得意分野で検索"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <select aria-label="業種" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">すべての業種</option>
            {categories.map((value) => <option key={value}>{value}</option>)}
          </select>
          <select aria-label="地域" value={area} onChange={(event) => setArea(event.target.value)}>
            <option value="">すべての地域</option>
            {areas.map((value) => <option key={value}>{value}</option>)}
          </select>
          <button className="button" type="button"><Search size={18} /> 検索</button>
        </div>
      </div>
      {error && <p className="error">データを取得できませんでした: {error}</p>}
      {loading ? (
        <Loading />
      ) : (
        <>
          <p className="list-count">{filtered.length}件中 {filtered.length ? (currentPage - 1) * 20 + 1 : 0}〜{Math.min(currentPage * 20, filtered.length)}件を表示</p>
          <div className="card-grid">
            {pageBusinesses.length ? pageBusinesses.map((business) => (
              <BusinessCard
                author={business.user_id ? authors[business.user_id] : undefined}
                business={business}
                likeCount={likeCounts[String(business.id)] ?? 0}
                key={business.id}
              />
            )) : <Empty text="条件に合う事業者が見つかりませんでした。" />}
          </div>
          <Pagination currentPage={currentPage} totalItems={filtered.length} onPageChange={setCurrentPage} />
        </>
      )}
    </>
  );
}
