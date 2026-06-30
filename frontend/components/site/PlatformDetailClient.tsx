"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PlatformDetail, Category } from "@/lib/types";
import { getPlatformColors } from "@/lib/types";
import { GameCard, GameCardLandscape } from "@/components/site/GameCard";
import { PlatformIcon, BackButton } from "@/components/site/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORTS = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Popular" },
  { value: "downloads", label: "Most Downloaded" },
  { value: "az", label: "A-Z" },
];

interface PlatformDetailClientProps {
  platform: PlatformDetail;
  categories: Category[];
}

export default function PlatformDetailClient({ platform, categories }: PlatformDetailClientProps) {
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState("latest");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");

  const uniqueContentTypes = useMemo(() => {
    const fromContents = Array.from(
      new Map(
        (platform.contents || [])
          .filter((c) => c.contentType?.slug && c.contentType?.name)
          .map((c) => [c.contentType!.slug, { slug: c.contentType!.slug, name: c.contentType!.name }])
      ).values()
    );
    return fromContents.length > 0
      ? fromContents
      : (platform.contentTypes || []).filter((ct) => ct.slug && ct.name);
  }, [platform]);

  const filtered = useMemo(() => {
    let items = platform.contents || [];
    if (contentTypeFilter !== "all") {
      items = items.filter((g) => g.contentType?.slug === contentTypeFilter);
    }
    if (genre !== "all") {
      items = items.filter((g) => g.fields?.genre === genre);
    }
    if (sort === "downloads") return [...items].sort((a, b) => b.downloads - a.downloads);
    if (sort === "popular") return [...items].sort((a, b) => b.popularity - a.popularity);
    if (sort === "az") return [...items].sort((a, b) => a.title.localeCompare(b.title));
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [platform, contentTypeFilter, genre, sort]);

  const colors = getPlatformColors(platform.slug);
  const color = platform.color || colors.color;
  const showTypeFilter = uniqueContentTypes.length > 1;
  const isGameType = contentTypeFilter === "all" || contentTypeFilter === "games";

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
      <BackButton />
      {/* Platform header */}
      <div className="flex items-center gap-3 sm:gap-5 mb-5 sm:mb-7">
        <div
          className="w-12 h-12 sm:w-16 sm:h-16 inline-grid place-items-center"
          style={{
            background: `linear-gradient(135deg, ${color}, ${colors.colorLight})`,
            boxShadow: `0 4px 16px ${color}4D`,
          }}
        >
          <PlatformIcon name={platform.icon || "Gamepad2"} className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <div>
          <h1 className="text-[20px] sm:text-[28px] font-black tracking-tight text-[#1A1A1A]">{platform.name}</h1>
          <div className="text-[11px] sm:text-[13px] text-[#777] font-medium">
            {(platform.contents || []).length.toLocaleString()} titles available
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 sm:mb-6 p-3 sm:p-4 bg-[#555555] border border-[#666666]">
        {showTypeFilter && (
          <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
            <SelectTrigger className="w-[130px] sm:w-[150px] h-8 sm:h-9 text-[12px] sm:text-[13px] font-semibold bg-[#666666] text-white border-[#777777]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-[#555555] border-[#777777] text-white text-[12px] sm:text-[13px]">
              <SelectItem value="all">All Types</SelectItem>
              {uniqueContentTypes.map((t) => (
                <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="w-[130px] sm:w-[150px] h-8 sm:h-9 text-[12px] sm:text-[13px] font-semibold bg-[#666666] text-white border-[#777777]">
            <SelectValue placeholder="All Genres" />
          </SelectTrigger>
          <SelectContent className="bg-[#555555] border-[#777777] text-white text-[12px] sm:text-[13px]">
            <SelectItem value="all">All Genres</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[130px] sm:w-[160px] h-8 sm:h-9 text-[12px] sm:text-[13px] font-semibold bg-[#666666] text-white border-[#777777]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#555555] border-[#777777] text-white text-[12px] sm:text-[13px]">
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-[12px] sm:text-[13px] text-[#AAAAAA] font-semibold tabular-nums ml-auto">
          {filtered.length} {filtered.length === 1 ? "title" : "titles"}
        </span>
      </div>

      {/* Content grid — portrait for games, landscape for software */}
      {filtered.length > 0 ? (
        <div className={`grid gap-3 sm:gap-5 ${isGameType ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
          {filtered.map((g) => {
            const itemIsGame = g.contentType?.slug === "games";
            return itemIsGame
              ? <GameCard key={g.id} game={g} typeSlug={g.contentType?.slug} />
              : <GameCardLandscape key={g.id} game={g} typeSlug={g.contentType?.slug} />;
          })}
        </div>
      ) : (
        <p className="text-[#777] text-[15px] py-12 text-center">No titles found for this filter.</p>
      )}
    </div>
  );
}
