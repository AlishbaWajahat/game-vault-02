"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Triangle, Gamepad2, Monitor, Disc3, Smartphone, Joystick, Newspaper, MessageSquarePlus, Cloud, CloudCog, CloudDownload, CloudUpload, type LucideIcon } from "lucide-react";
import { fetchPlatforms, fetchContentTypes } from "@/lib/api";
import type { Platform, ContentType } from "@/lib/types";

function Navbar({ contentTypes, platforms }: { contentTypes: ContentType[]; platforms: Platform[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const PLATFORM_ICON_MAP: Record<string, LucideIcon> = {
    pc: Monitor, playstation: Disc3, xbox: Gamepad2, switch: Gamepad2,
    gba: Joystick, snes: Joystick, n64: Joystick, nds: Smartphone,
    psp: Smartphone, wii: Gamepad2, ps2: Disc3, dreamcast: Disc3,
  };

  const navPlatforms = platforms.slice(0, 6);
  const secondaryItems: { href: string; label: string; icon: LucideIcon }[] = [
    ...contentTypes.map((t) => ({ href: `/${t.slug}`, label: t.name.toUpperCase(), icon: t.slug === "games" ? Gamepad2 : Monitor })),
    ...navPlatforms.map((p) => ({ href: `/platforms/${p.slug}`, label: p.name.toUpperCase(), icon: PLATFORM_ICON_MAP[p.slug] || Gamepad2 })),
    { href: "/articles", label: "ARTICLES", icon: Newspaper },
    { href: "/request-game", label: "REQUEST", icon: MessageSquarePlus },
  ];

  const navLinks = [
    ...contentTypes.map((t) => ({ to: `/${t.slug}`, label: `Browse ${t.name}` })),
    { to: "/articles", label: "Articles" },
    { to: "/request-game", label: "Request" },
  ];

  return (
    <>
      {/* Primary navbar — gray #555555 */}
      <header
        className={`sticky top-0 z-50 transition-all ${
          scrolled
            ? "backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
            : ""
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-10 h-[48px] sm:h-[56px] flex items-center justify-between bg-[#555555]">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 font-black text-[18px] sm:text-[22px] tracking-tight text-white shrink-0">
            <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-[#468284]">
              <Triangle size={10} className="sm:w-[12px] sm:h-[12px]" fill="#fff" stroke="#fff" />
            </span>
            ROMHAVEN
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setDrawer(true)}
            className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 border border-[#468284]/40 inline-flex items-center justify-center text-[#CCC] hover:text-[#468284] transition-colors"
            aria-label="Menu"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Secondary nav — teal green #4fb38c, Orbitron font */}
        <div className="hidden lg:block w-full bg-[#4fb38c]">
          <div className="flex items-stretch" style={{ fontFamily: "var(--font-orbitron), sans-serif" }}>
            {secondaryItems.map((item) => {
              const IconComp = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex-1 flex items-center justify-center gap-2 h-[48px] text-[15px] font-bold tracking-wide whitespace-nowrap transition-all relative ${
                    isActive(item.href)
                      ? "text-[#333333]"
                      : "text-[#555555] hover:text-[#333333]"
                  }`}
                >
                  <IconComp size={16} />
                  {item.label}
                  {/* Underline — active or hover */}
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-[#555555] transition-all duration-200 ${
                      isActive(item.href)
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-200 ease-out ${drawer ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawer(false)} />
        <div
          className={`absolute right-0 top-0 bottom-0 w-[260px] sm:w-[300px] bg-[#555555] border-l border-[#666666] p-4 sm:p-6 flex flex-col gap-0.5 overflow-y-auto transition-transform duration-200 ease-out ${drawer ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-extrabold text-[14px] sm:text-[16px] text-white">Menu</span>
            <button onClick={() => setDrawer(false)} className="w-7 h-7 border border-[#468284]/40 inline-flex items-center justify-center text-[#CCC] hover:text-[#468284]">
              <X size={14} />
            </button>
          </div>

          <div className="eyebrow text-[10px] sm:text-[11px] mb-1.5 px-2.5">Platforms</div>
          {platforms.map((p) => (
            <Link
              key={p.slug}
              href={`/platforms/${p.slug}`}
              onClick={() => setDrawer(false)}
              className={`text-[13px] font-medium px-2.5 py-1.5 transition-colors ${
                isActive(`/platforms/${p.slug}`)
                  ? "text-white bg-[#468284]"
                  : "text-[#CCC] hover:text-[#4fb38c] hover:bg-[#666666]"
              }`}
            >
              {p.name}
            </Link>
          ))}

          <div className="w-full h-px bg-[#666666] my-2" />
          <div className="eyebrow text-[10px] sm:text-[11px] mb-1.5 px-2.5">Pages</div>
          {navLinks.map((n) => (
            <Link
              key={n.to}
              href={n.to}
              onClick={() => setDrawer(false)}
              className={`text-[13px] font-medium px-2.5 py-1.5 transition-colors ${
                isActive(n.to)
                  ? "text-white bg-[#468284]"
                  : "text-[#CCC] hover:text-[#4fb38c] hover:bg-[#666666]"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/about"
            onClick={() => setDrawer(false)}
            className="text-[13px] font-medium px-2.5 py-1.5 text-[#CCC] hover:text-[#4fb38c] hover:bg-[#666666] transition-colors"
          >
            About
          </Link>
        </div>
      </div>
    </>
  );
}

function Footer({ contentTypes }: { contentTypes: ContentType[] }) {
  return (
    <footer className="border-t border-[#666666] mt-10 sm:mt-16 bg-[#555555]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 font-extrabold text-[18px] text-white mb-2">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-[#468284]">
                <Triangle size={11} fill="#fff" stroke="#fff" />
              </span>
              ROMHAVEN
            </div>
            <p className="text-[12px] text-[#AAAAAA] max-w-xs">
              Your trusted source for ROMs, repacks, and indie games across every platform.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
            {contentTypes.map((t) => (
              <Link key={t.slug} href={`/${t.slug}`} className="text-[#AAAAAA] hover:text-[#4fb38c] transition-colors">{t.name}</Link>
            ))}
            <Link href="/platforms" className="text-[#AAAAAA] hover:text-[#4fb38c] transition-colors">Platforms</Link>
            <Link href="/articles" className="text-[#AAAAAA] hover:text-[#4fb38c] transition-colors">Articles</Link>
            <Link href="/about" className="text-[#AAAAAA] hover:text-[#4fb38c] transition-colors">About</Link>
            <Link href="/contact" className="text-[#AAAAAA] hover:text-[#4fb38c] transition-colors">Contact</Link>
            <Link href="/contact" className="text-[#AAAAAA] hover:text-[#4fb38c] transition-colors">DMCA</Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-[#666666] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-[#999999]">&copy; {new Date().getFullYear()} ROMHAVEN. All rights reserved.</span>
          <span className="text-[11px] text-[#999999]">
            All trademarks are property of their respective owners. This site does not host any copyrighted material.
          </span>
        </div>
      </div>
    </footer>
  );
}

function BackgroundIcons() {
  const icons = [
    { Icon: Cloud, top: "5%", left: "3%", size: 80, rotate: 10 },
    { Icon: CloudCog, top: "12%", right: "5%", size: 70, rotate: -15 },
    { Icon: CloudDownload, top: "25%", left: "8%", size: 60, rotate: 20 },
    { Icon: Cloud, top: "30%", right: "12%", size: 90, rotate: -5 },
    { Icon: CloudUpload, top: "45%", left: "2%", size: 65, rotate: 15 },
    { Icon: Cloud, top: "48%", right: "3%", size: 75, rotate: -20 },
    { Icon: CloudCog, top: "60%", left: "10%", size: 55, rotate: 8 },
    { Icon: CloudDownload, top: "65%", right: "8%", size: 85, rotate: -12 },
    { Icon: Cloud, top: "78%", left: "5%", size: 70, rotate: -8 },
    { Icon: CloudUpload, top: "82%", right: "6%", size: 60, rotate: 18 },
    { Icon: Cloud, top: "92%", left: "15%", size: 50, rotate: -25 },
    { Icon: CloudCog, top: "18%", left: "45%", size: 45, rotate: 30 },
    { Icon: Cloud, top: "55%", left: "50%", size: 55, rotate: -10 },
    { Icon: CloudDownload, top: "38%", right: "25%", size: 50, rotate: 5 },
    { Icon: Cloud, top: "72%", left: "30%", size: 65, rotate: -22 },
    { Icon: CloudUpload, top: "88%", right: "20%", size: 45, rotate: 12 },
  ];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {icons.map((item, i) => {
        const style: React.CSSProperties = {
          position: "absolute",
          top: item.top,
          transform: `rotate(${item.rotate}deg)`,
          ...(item.left ? { left: item.left } : {}),
          ...(item.right ? { right: item.right } : {}),
        };
        return (
          <item.Icon
            key={i}
            size={item.size}
            style={style}
            className="text-[#555555]/[0.07]"
          />
        );
      })}
    </div>
  );
}

function ScrollToTop() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function Layout({ children }: { children: ReactNode }) {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    fetchContentTypes().then(setContentTypes).catch(() => {});
    fetchPlatforms().then(setPlatforms).catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#E8E8E8]">
      <BackgroundIcons />
      <ScrollToTop />
      <Navbar contentTypes={contentTypes} platforms={platforms} />
      <main className="relative z-10 flex-1 animate-fade-up">{children}</main>
      <Footer contentTypes={contentTypes} />
    </div>
  );
}
