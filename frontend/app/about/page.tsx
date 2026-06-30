import Link from "next/link";
import type { Metadata } from "next";
import {
  fetchContentTypesServer,
  fetchPlatformsServer,
  fetchContentByTypeServer,
  fetchSettingsServer,
} from "@/lib/api";
import { Gamepad2, Shield, Zap, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "ROMHAVEN is a curated archive of ROMs, PC games, and indie titles spanning multiple platforms. Learn about our mission.",
  alternates: { canonical: "/about" },
};

export const revalidate = 300;

type Settings = {
  about_heading?: string;
  site_name?: string;
  about_content?: string;
  about_mission?: string;
};

export default async function About() {
  const [types, platforms, settings] = await Promise.all([
    fetchContentTypesServer().catch(() => []),
    fetchPlatformsServer().catch(() => []),
    fetchSettingsServer().catch(
      (): Settings => ({
        about_heading: "",
        site_name: "",
        about_content: "",
        about_mission: "",
      })
    ),
  ]);

  let totalContent = 0;

  for (const t of types) {
    try {
      const result = await fetchContentByTypeServer(t.slug, { limit: 1 });
      totalContent += result.pagination.total;
    } catch {
      // skip
    }
  }

  const platformCount = platforms.length;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-medium text-[#777] hover:text-[#1A1A1A] transition-colors mb-2"
      >
        <ArrowLeft size={13} /> Back
      </Link>
      <h1 className="text-[26px] sm:text-[36px] font-black tracking-tight text-[#1A1A1A]">
        {settings.about_heading || settings.site_name || "About ROMHAVEN"}
      </h1>

      <div className="mt-6 text-[14px] text-[#444444] leading-relaxed space-y-4">
        <p>
          {settings.about_content ||
            "ROMHAVEN is a curated archive of ROMs, PC games, and indie titles spanning multiple platforms. Every entry is verified, versioned, and updated daily."}
        </p>

        <p>
          {settings.about_mission ||
            "Our mission is to preserve and provide access to games across every platform — from modern PC releases and Nintendo Switch titles to classic GBA and SNES ROMs. All downloads are free and always will be."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
        {[
          {
            icon: <Gamepad2 size={18} />,
            title: totalContent > 0 ? `${totalContent} Titles` : "Titles",
            desc:
              platformCount > 0
                ? `Across ${platformCount} platforms`
                : "Across multiple platforms",
          },
          {
            icon: <Zap size={18} />,
            title: "Fast Downloads",
            desc: "No waiting, no limits",
          },
          {
            icon: <Shield size={18} />,
            title: "Verified Files",
            desc: "Scanned and tested",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="border border-[#666666] bg-[#555555] p-4 shadow-sm"
          >
            <div className="w-9 h-9 bg-[#468284]/10 inline-flex items-center justify-center text-[#468284] mb-3">
              {item.icon}
            </div>

            <div className="text-[14px] font-bold text-white">
              {item.title}
            </div>

            <div className="text-[12px] text-[#AAAAAA] mt-0.5">
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-[14px] text-[#444444] leading-relaxed">
        If you have questions, need to report an issue, or want to request a
        game, visit our{" "}
        <Link
          href="/contact"
          className="text-[#468284] hover:text-[#4fb38c] font-semibold transition-colors"
        >
          Contact
        </Link>{" "}
        or{" "}
        <Link
          href="/request-game"
          className="text-[#468284] hover:text-[#4fb38c] font-semibold transition-colors"
        >
          Request a Game
        </Link>{" "}
        page.
      </p>
    </div>
  );
}
