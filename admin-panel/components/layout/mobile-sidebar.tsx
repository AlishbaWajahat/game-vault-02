"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Blocks,
  FolderOpen,
  Monitor,
  Tags,
  FileText,
  MessageSquare,
  Download,
  Users,
  Settings,
  ClipboardList,
  ScrollText,
  Library,
  PanelLeft,
  PanelLeftClose,
  Gamepad2,
  Package,
  Puzzle,
  AppWindow,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  gamepad: Gamepad2,
  games: Gamepad2,
  software: Package,
  plugins: Puzzle,
  apps: AppWindow,
  monitor: Monitor,
  folder: FolderOpen,
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface ContentTypeNav {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

const topItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "CONTENT_MANAGER", "GAME_MANAGER"] },
  { label: "Content Types", href: "/content-types", icon: Blocks, roles: ["SUPER_ADMIN"] },
];

const bottomItems: NavItem[] = [
  { label: "Platforms", href: "/platforms", icon: Monitor, roles: ["SUPER_ADMIN"] },
  { label: "Genres", href: "/categories", icon: Tags, roles: ["SUPER_ADMIN"] },
  { label: "Articles", href: "/articles", icon: FileText, roles: ["SUPER_ADMIN", "CONTENT_MANAGER"] },
  { label: "Requests", href: "/requests", icon: ClipboardList, roles: ["SUPER_ADMIN", "GAME_MANAGER"] },
  { label: "Messages", href: "/messages", icon: MessageSquare, roles: ["SUPER_ADMIN", "CONTENT_MANAGER"] },
  { label: "Downloads", href: "/downloads", icon: Download, roles: ["SUPER_ADMIN", "GAME_MANAGER"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN", "CONTENT_MANAGER"] },
  { label: "Users", href: "/users", icon: Users, roles: ["SUPER_ADMIN"] },
  { label: "Audit Log", href: "/audit-log", icon: ScrollText, roles: ["SUPER_ADMIN"] },
];

interface MobileSidebarProps {
  userRole: string;
}

export function MobileSidebar({ userRole }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [contentTypes, setContentTypes] = useState<ContentTypeNav[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function fetchContentTypes() {
      if (["SUPER_ADMIN", "GAME_MANAGER"].includes(userRole)) {
        api<{ success: boolean; data: ContentTypeNav[] }>("/admin/content-types")
          .then((res) => setContentTypes(res.data))
          .catch(() => {});
      }
    }
    fetchContentTypes();
    window.addEventListener("content-types-changed", fetchContentTypes);
    return () => window.removeEventListener("content-types-changed", fetchContentTypes);
  }, [userRole, pathname]);

  const filteredTop = topItems.filter((item) => item.roles.includes(userRole));
  const filteredBottom = bottomItems.filter((item) => item.roles.includes(userRole));
  const showContent = ["SUPER_ADMIN", "GAME_MANAGER"].includes(userRole);

  function renderLink(item: NavItem) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "text-white"
            : "text-gray-300 hover:text-white",
        )}
        style={isActive ? { backgroundColor: "#444444" } : undefined}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    );
  }

  const overlay = open && mounted ? createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/60" onClick={() => setOpen(false)} />
      <div
        className="fixed inset-y-0 left-0 z-[70] flex flex-col w-3/4 max-w-[300px]"
        style={{ backgroundColor: "#333333" }}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b" style={{ borderColor: "#444444" }}>
          <Link href="/dashboard" className="text-sm font-bold tracking-tight" style={{ color: "#4fb38c" }} onClick={() => setOpen(false)}>
            ROMHAVEN
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "rgba(226,232,240,0.5)" }}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {filteredTop.map(renderLink)}

          {showContent && contentTypes.length > 0 && (
            <>
              <Separator className="my-2" style={{ backgroundColor: "#444444" }} />
              <p className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(226,232,240,0.4)" }}>
                Content
              </p>
              {contentTypes.map((ct) => {
                const href = `/content/${ct.slug}`;
                const isActive = pathname === href || pathname.startsWith(href + "/");
                const Icon = iconMap[ct.icon?.toLowerCase() || ""] || iconMap[ct.slug?.toLowerCase() || ""] || FolderOpen;
                return (
                  <Link
                    key={ct.id}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "text-white"
                        : "text-gray-300 hover:text-white",
                    )}
                    style={isActive ? { backgroundColor: "#444444" } : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{ct.name}</span>
                  </Link>
                );
              })}
              <Link
                href="/content/shared"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/content/shared"
                    ? "text-white"
                    : "text-gray-300 hover:text-white",
                )}
                style={pathname === "/content/shared" ? { backgroundColor: "#444444" } : undefined}
              >
                <Library className="h-4 w-4 shrink-0" />
                Shared Library
              </Link>
              <Separator className="my-2" style={{ backgroundColor: "#444444" }} />
            </>
          )}

          {filteredBottom.map(renderLink)}
        </nav>
        <div className="px-4 py-2.5 border-t" style={{ borderColor: "#444444" }}>
          <p className="text-[11px]" style={{ color: "rgba(226,232,240,0.5)" }}>Admin Panel v1.0</p>
        </div>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-md transition-colors hover:bg-accent"
        style={{ color: "#468284" }}
      >
        <PanelLeft className="h-5 w-5" />
      </button>
      {overlay}
    </div>
  );
}
