import Link from "next/link";
import type { Metadata } from "next";
import { fetchPlatformsServer } from "@/lib/api";
import type { Platform } from "@/lib/types";
import { getPlatformColors } from "@/lib/types";
import { PageHeader, PlatformIcon } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "All Platforms",
  description:
    "Browse games by platform — modern consoles like Switch and PlayStation, and classics like GBA, SNES, and N64.",
  alternates: { canonical: "/platforms" },
};

export const revalidate = 120;

function PlatformCard({ platform }: { platform: Platform }) {
  const colors = getPlatformColors(platform.slug);
  const color = platform.color || colors.color;
  return (
    <Link
      href={`/platforms/${platform.slug}`}
      className="group border border-[#666666] bg-[#555555] p-4 sm:p-7 shadow-sm block"
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div
          className="w-10 h-10 sm:w-14 sm:h-14 inline-grid place-items-center"
          style={{ background: `linear-gradient(135deg, ${color}, ${colors.colorLight})` }}
        >
          <PlatformIcon name={platform.icon || "Gamepad2"} className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </div>
        {platform.classic && (
          <span
            className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1"
            style={{ color, backgroundColor: colors.colorBg }}
          >
            Classic
          </span>
        )}
      </div>
      <div className="text-[14px] sm:text-[17px] font-bold text-white">{platform.name}</div>
      <div className="text-[11px] sm:text-[13px] text-[#AAAAAA] mt-0.5 sm:mt-1">{platform.count.toLocaleString()} titles</div>
      <div
        className="mt-3 sm:mt-4 text-[12px] sm:text-[14px] font-semibold transition-opacity group-hover:opacity-80"
        style={{ color }}
      >
        Browse &rarr;
      </div>
    </Link>
  );
}

export default async function PlatformsIndex() {
  const platforms = await fetchPlatformsServer();

  const modern = platforms.filter((p) => !p.classic);
  const classic = platforms.filter((p) => p.classic);

  return (
    <div>
      <PageHeader title="Platforms" subtitle="Modern consoles and the classics, side by side." showBack />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pb-10 sm:pb-16">
        {modern.length > 0 && (
          <>
            <div className="eyebrow text-[12px] sm:text-[13px] mb-3 sm:mb-4">Modern</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {modern.map((p) => <PlatformCard key={p.slug} platform={p} />)}
            </div>
          </>
        )}
        {classic.length > 0 && (
          <>
            <div className="eyebrow text-[12px] sm:text-[13px] mt-8 sm:mt-10 mb-3 sm:mb-4">Retro / Classic</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {classic.map((p) => <PlatformCard key={p.slug} platform={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
