"use client";

import Link from "next/link";
import Image from "next/image";
import { Download, Star } from "lucide-react";
import type { ContentItem } from "@/lib/types";
import { FALLBACK_COVER } from "@/lib/data";

function formatDownloads(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toString();
}

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  img.srcset = "";
  img.src = FALLBACK_COVER;
}

/** Portrait card — vertical rectangular (for games/ROMs) */
export function GameCard({ game, typeSlug }: { game: ContentItem; typeSlug?: string }) {
  const slug = typeSlug || game.contentType?.slug || "games";
  const rating = game.fields?.rating as number | undefined;
  const isRom = game.fields?.isRom as boolean | undefined;
  const fileSize = game.totalFileSize || (game.fields?.fileSize as string | undefined);

  return (
    <Link
      href={`/${slug}/${game.slug}`}
      className="group block bg-[#555555] overflow-hidden card-glow shadow-sm"
    >
      {/* Cover image — portrait aspect */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#444444]">
        <Image
          src={game.coverImage || FALLBACK_COVER}
          alt={game.title}
          fill
          sizes="(max-width: 640px) 50vw, 220px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={handleImgError}
        />
        {/* ROM indicator */}
        {isRom && (
          <span className="absolute top-1.5 left-1.5 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-[#468284] text-white">
            ROM
          </span>
        )}
      </div>

      {/* Details below */}
      <div className="p-1.5 sm:p-2.5">
        <div className="text-[10px] sm:text-[12px] font-bold text-white line-clamp-1 group-hover:text-[#4fb38c] transition-colors">
          {game.title}
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 text-[8px] sm:text-[10px] text-[#AAAAAA]">
          {game.platform[0] && <span>{game.platform[0]}</span>}
          {rating !== undefined && rating > 0 && (
            <span className="flex items-center gap-0.5 text-[#facc15]">
              <Star size={7} className="sm:w-[9px] sm:h-[9px]" fill="#facc15" stroke="#facc15" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
        {fileSize && (
          <div className="text-[8px] sm:text-[9px] text-[#999999] mt-0.5">{fileSize}</div>
        )}

        {/* Download row */}
        <div className="flex items-center justify-between mt-1 sm:mt-1.5 pt-1 border-t border-[#666666]">
          <span className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] text-[#999999]">
            <Download size={8} className="sm:w-[9px] sm:h-[9px]" />
            {formatDownloads(game.downloads)}
          </span>
          <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-[#468284] text-white text-[8px] sm:text-[10px] font-bold hover:bg-[#3a6e70] transition-colors">
            <Download size={8} className="sm:w-[9px] sm:h-[9px]" />
            Get
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Landscape card — horizontal (for software) */
export function GameCardLandscape({ game, typeSlug }: { game: ContentItem; typeSlug?: string }) {
  const slug = typeSlug || game.contentType?.slug || "games";
  const rating = game.fields?.rating as number | undefined;
  const isRom = game.fields?.isRom as boolean | undefined;
  const fileSize = game.totalFileSize || (game.fields?.fileSize as string | undefined);

  return (
    <Link
      href={`/${slug}/${game.slug}`}
      className="group flex bg-[#555555] overflow-hidden card-glow h-[90px] sm:h-[120px] shadow-sm"
    >
      {/* Cover image with gradient shading */}
      <div className="relative w-[75px] sm:w-[100px] shrink-0 bg-[#444444] overflow-hidden">
        <Image
          src={game.coverImage || FALLBACK_COVER}
          alt={game.title}
          fill
          sizes="110px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={handleImgError}
        />
        {/* Gradient shading on right edge */}
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-[#555555]" />

        {/* ROM indicator */}
        {isRom && (
          <span className="absolute top-1.5 left-1.5 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-[#468284] text-white">
            ROM
          </span>
        )}
      </div>

      {/* Details on right */}
      <div className="flex-1 min-w-0 p-1.5 sm:p-2.5 flex flex-col justify-between">
        <div>
          <div className="text-[10px] sm:text-[12px] font-bold text-white line-clamp-1 group-hover:text-[#4fb38c] transition-colors">
            {game.title}
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 text-[8px] sm:text-[10px] text-[#AAAAAA]">
            {game.platform[0] && <span>{game.platform[0]}</span>}
            {rating !== undefined && rating > 0 && (
              <span className="flex items-center gap-0.5 text-[#facc15]">
                <Star size={7} className="sm:w-[9px] sm:h-[9px]" fill="#facc15" stroke="#facc15" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>
          {fileSize && (
            <div className="text-[8px] sm:text-[10px] text-[#999999] mt-0.5">{fileSize}</div>
          )}
        </div>

        {/* Download button */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] text-[#999999]">
            <Download size={8} className="sm:w-[9px] sm:h-[9px]" />
            {formatDownloads(game.downloads)}
          </span>
          <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-[#468284] text-white text-[8px] sm:text-[10px] font-bold hover:bg-[#3a6e70] transition-colors">
            <Download size={8} className="sm:w-[9px] sm:h-[9px]" />
            Get
          </span>
        </div>
      </div>
    </Link>
  );
}

export function GameCardWide({ game, typeSlug }: { game: ContentItem; typeSlug?: string }) {
  const slug = typeSlug || game.contentType?.slug || "games";
  const rating = game.fields?.rating as number | undefined;
  const genre = game.fields?.genre as string | undefined;
  const fileSize = game.totalFileSize || (game.fields?.fileSize as string | undefined);

  return (
    <Link
      href={`/${slug}/${game.slug}`}
      className="group flex gap-4 bg-[#555555] p-3 card-glow shadow-sm"
    >
      <div className="relative w-[80px] h-[107px] overflow-hidden bg-[#444444] shrink-0">
        <Image
          src={game.coverImage || FALLBACK_COVER}
          alt={game.title}
          fill
          sizes="80px"
          className="object-cover"
          onError={handleImgError}
        />
      </div>
      <div className="flex-1 min-w-0 py-1">
        <div className="text-[13px] font-bold text-white line-clamp-1 group-hover:text-[#4fb38c] transition-colors">
          {game.title}
        </div>
        <div className="text-[11px] text-[#AAAAAA] mt-1">
          {game.platform[0]}{genre ? ` \u00b7 ${genre}` : ""}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-[#AAAAAA]">
          {rating !== undefined && rating > 0 && (
            <span className="flex items-center gap-1">
              <Star size={10} fill="#facc15" stroke="#facc15" />
              {rating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Download size={10} />
            {formatDownloads(game.downloads)}
          </span>
          {fileSize && <span>{fileSize}</span>}
        </div>
      </div>
    </Link>
  );
}
