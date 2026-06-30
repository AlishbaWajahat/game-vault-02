"use client";

import { useState, useCallback } from "react";
import { fetchContentByType } from "@/lib/api";
import type { ContentItem, Platform, Category, ContentType } from "@/lib/types";
import { GameCard, GameCardLandscape } from "@/components/site/GameCard";
import { PageHeader } from "@/components/site/ui";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORTS: { label: string; value: "newest" | "downloads" | "title" | "popularity" }[] = [
  { label: "Newest", value: "newest" },
  { label: "Most Downloaded", value: "downloads" },
  { label: "Popular", value: "popularity" },
  { label: "A-Z", value: "title" },
];
const LIMIT = 24;

interface ContentListClientProps {
  contentType: ContentType;
  initialItems: ContentItem[];
  initialTotal: number;
  initialTotalPages: number;
  platforms: Platform[];
  categories: Category[];
}

export default function ContentListClient({
  contentType,
  initialItems,
  initialTotal,
  initialTotalPages,
  platforms,
  categories,
}: ContentListClientProps) {
  const typeSlug = contentType.slug;
  const typeName = contentType.name;
  const isGameType = typeSlug === "games";

  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState("__all__");
  const [genre, setGenre] = useState("__all__");
  const [sort, setSort] = useState<"newest" | "downloads" | "title" | "popularity">("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);

  const loadContent = useCallback(async (p: number, plat: string, gen: string, s: typeof sort) => {
    setLoading(true);
    try {
      const activePlat = plat === "__all__" ? "" : plat;
      const activeGen = gen === "__all__" ? "" : gen;
      const filters: Record<string, string> = {};
      if (activeGen) filters.genre = activeGen;

      const res = await fetchContentByType(typeSlug, {
        page: p,
        limit: LIMIT,
        platform: activePlat || undefined,
        sort: s,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });
      setItems(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error("Failed to load content:", err);
    } finally {
      setLoading(false);
    }
  }, [typeSlug]);

  function handleFilterChange(newPlat: string, newGenre: string, newSort: typeof sort) {
    setPlatform(newPlat);
    setGenre(newGenre);
    setSort(newSort);
    setPage(1);
    loadContent(1, newPlat, newGenre, newSort);
  }

  function goToPage(p: number) {
    setPage(p);
    loadContent(p, platform, genre, sort);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      <PageHeader title={`Browse ${typeName}`} subtitle={`Explore our full ${typeName.toLowerCase()} library across all platforms.`} showBack />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pb-8 sm:pb-12">
        {/* Filter bar */}
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8 p-3 sm:p-4 bg-[#555555] border border-[#666666]">
          <SlidersHorizontal size={14} className="hidden sm:block text-[#AAAAAA] sm:w-4 sm:h-4" />
          <Select value={platform} onValueChange={(val) => handleFilterChange(val === "__all__" ? "" : val, genre, sort)}>
            <SelectTrigger className="w-full sm:w-[160px] h-8 sm:h-9 text-[12px] sm:text-[13px] font-semibold bg-[#666666] text-white border-[#777777]">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent className="bg-[#555555] border-[#777777] text-white text-[12px] sm:text-[13px]">
              <SelectItem value="__all__">All Platforms</SelectItem>
              {platforms.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categories.length > 0 && (
            <Select value={genre} onValueChange={(val) => handleFilterChange(platform, val === "__all__" ? "" : val, sort)}>
              <SelectTrigger className="w-full sm:w-[160px] h-8 sm:h-9 text-[12px] sm:text-[13px] font-semibold bg-[#666666] text-white border-[#777777]">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent className="bg-[#555555] border-[#777777] text-white text-[12px] sm:text-[13px]">
                <SelectItem value="__all__">All Genres</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sort} onValueChange={(val) => handleFilterChange(platform, genre, val as typeof sort)}>
            <SelectTrigger className="w-full sm:w-[160px] h-8 sm:h-9 text-[12px] sm:text-[13px] font-semibold bg-[#666666] text-white border-[#777777]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#555555] border-[#777777] text-white text-[12px] sm:text-[13px]">
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="col-span-3 text-right text-[12px] sm:text-[14px] text-[#AAAAAA] sm:ml-auto font-medium">
            {total} {total === 1 ? "title" : "titles"}
          </span>
        </div>

        {/* Content grid */}
        {loading ? (
          <div className={`grid gap-3 sm:gap-5 ${isGameType ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`${isGameType ? "aspect-[3/5]" : "h-[130px]"} bg-[#D0D0D0] animate-pulse`} />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className={`grid gap-3 sm:gap-5 ${isGameType ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
            {items.map((g) => (
              isGameType
                ? <GameCard key={g.id} game={g} typeSlug={typeSlug} />
                : <GameCardLandscape key={g.id} game={g} typeSlug={typeSlug} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[#777] text-[14px]">No {typeName.toLowerCase()} match your filters.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-6 sm:mt-8">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="w-8 h-8 sm:w-9 sm:h-9 text-[12px] font-bold bg-[#555555] border border-[#666666] text-white hover:text-[#468284] hover:border-[#468284]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = page <= 3 ? i + 1 : page + i - 2;
              if (pageNum < 1 || pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 text-[11px] sm:text-[12px] font-bold transition-all ${
                    pageNum === page
                      ? "bg-[#468284] text-white shadow-[0_2px_8px_rgba(70,130,132,0.3)]"
                      : "bg-[#555555] border border-[#666666] text-white hover:text-[#468284] hover:border-[#468284]/40"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="w-8 h-8 sm:w-9 sm:h-9 text-[12px] font-bold bg-[#555555] border border-[#666666] text-white hover:text-[#468284] hover:border-[#468284]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
