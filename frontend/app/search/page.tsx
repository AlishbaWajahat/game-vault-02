"use client";

import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { searchContent } from "@/lib/api";
import type { ContentItem, Article } from "@/lib/types";
import { GameCard } from "@/components/site/GameCard";
import Image from "next/image";
import { Gamepad2, Search, X, Calendar, FileText } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type FilterType = "all" | "articles" | string;

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [contentResults, setContentResults] = useState<ContentItem[]>([]);
  const [articleResults, setArticleResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const ref = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { ref.current?.focus(); }, []);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setContentResults([]);
      setArticleResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const result = await searchContent(query.trim());
      setContentResults(result.content || []);
      setArticleResults(result.articles || []);
      setSearched(true);
      setActiveFilter("all");
    } catch {
      setContentResults([]);
      setArticleResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initial) doSearch(initial);
  }, [initial, doSearch]);

  function handleChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  const contentByType = useMemo(() => {
    const groups: Record<string, { name: string; slug: string; items: ContentItem[] }> = {};
    for (const item of contentResults) {
      const slug = item.contentType?.slug || "other";
      const name = item.contentType?.name || "Other";
      if (!groups[slug]) groups[slug] = { name, slug, items: [] };
      groups[slug].items.push(item);
    }
    return Object.values(groups);
  }, [contentResults]);

  const filterOptions = useMemo(() => {
    const opts: { key: FilterType; label: string; count: number }[] = [];
    const totalContent = contentResults.length;
    const totalArticles = articleResults.length;
    const total = totalContent + totalArticles;
    opts.push({ key: "all", label: "All", count: total });
    for (const group of contentByType) {
      opts.push({ key: group.slug, label: group.name, count: group.items.length });
    }
    if (totalArticles > 0) {
      opts.push({ key: "articles", label: "Articles", count: totalArticles });
    }
    return opts;
  }, [contentByType, contentResults.length, articleResults.length]);

  const showContent = activeFilter === "all" || (activeFilter !== "articles" && contentByType.some((g) => g.slug === activeFilter));
  const showArticles = activeFilter === "all" || activeFilter === "articles";
  const filteredContentGroups = activeFilter === "all" ? contentByType : contentByType.filter((g) => g.slug === activeFilter);
  const totalResults = contentResults.length + articleResults.length;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 animate-fade-up">
      <div className="flex items-center gap-3 max-w-2xl">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#999]" />
          <input
            ref={ref}
            value={q}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search games, software, articles..."
            className="w-full h-[44px] sm:h-[48px] pl-10 sm:pl-11 pr-4 bg-[#555555] border border-[#666666] text-[13px] sm:text-[14px] text-white placeholder-[#999999] outline-none focus:ring-2 focus:ring-[#468284]/30 focus:border-[#468284] transition-all"
          />
        </div>
        <button
          onClick={() => router.back()}
          className="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] bg-[#555555] border border-[#666666] inline-flex items-center justify-center text-[#AAAAAA] hover:text-white hover:border-[#468284]/40 transition-all shrink-0"
          aria-label="Close search"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-6">
        {!searched && !loading ? (
          <p className="text-[#777] text-[13px]">Start typing to search&hellip;</p>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#F0F0F0] animate-pulse" />
            ))}
          </div>
        ) : totalResults > 0 ? (
          <>
            <p className="text-[12px] text-[#777] mb-4 font-medium">
              {totalResults} {totalResults === 1 ? "result" : "results"} for &ldquo;{q}&rdquo;
            </p>

            {filterOptions.length > 2 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setActiveFilter(opt.key)}
                    className={`text-[11px] sm:text-[12px] px-3 sm:px-4 py-1.5 sm:py-2 font-semibold transition-all ${
                      activeFilter === opt.key
                        ? "bg-[#468284] text-white shadow-[0_2px_8px_rgba(70,130,132,0.3)]"
                        : "bg-[#555555] border border-[#555555] text-[#ccc] hover:text-white hover:border-[#468284]/40"
                    }`}
                  >
                    {opt.label}
                    <span className={`ml-1.5 ${activeFilter === opt.key ? "text-white/70" : "text-[#999999]"}`}>
                      {opt.count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showContent && filteredContentGroups.map((group) => (
              <div key={group.slug} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[13px] sm:text-[14px] font-bold text-[#1A1A1A]">{group.name}</span>
                  <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 bg-[#468284]/15 text-[#468284] border border-[#468284]/20">
                    {group.items.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {group.items.map((g) => (
                    <GameCard key={g.id} game={g} typeSlug={g.contentType?.slug} />
                  ))}
                </div>
              </div>
            ))}

            {showArticles && articleResults.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-[#f59e0b]" />
                  <span className="text-[13px] sm:text-[14px] font-bold text-[#1A1A1A]">Articles</span>
                  <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/20">
                    {articleResults.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {articleResults.map((a) => (
                    <Link
                      key={a.id}
                      href={`/articles/${a.slug}`}
                      className="group overflow-hidden bg-[#555555] border border-[#666666] shadow-sm block"
                    >
                      {a.image && (
                        <div className="relative h-[120px]">
                          <Image src={a.image} alt={a.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="text-[13px] font-bold text-white line-clamp-2 group-hover:text-[#468284] transition-colors">
                          {a.title}
                        </div>
                        <div className="text-[11px] text-[#AAAAAA] mt-1 flex items-center gap-1">
                          <Calendar size={10} /> {a.date}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Gamepad2 size={48} className="mx-auto text-[#666666]" />
            <p className="mt-3 text-[14px] text-[#777]">No results for &ldquo;{q}&rdquo;</p>
            <p className="text-[12px] text-[#777] mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="w-full max-w-2xl h-[48px] bg-[#555555] border border-[#666666] animate-pulse" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
