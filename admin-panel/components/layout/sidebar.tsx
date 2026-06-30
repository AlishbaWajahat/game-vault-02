"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  Gamepad2,
  Package,
  Puzzle,
  AppWindow,
  PanelLeftClose,
  PanelLeft,
  Upload,
  Pause,
  type LucideIcon,
} from "lucide-react";
import {
  useUploadTasks,
  getProgress,
  formatFileSize,
  formatETA,
} from "@/lib/upload-manager";

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

interface SidebarProps {
  userRole: string;
  collapsed: boolean;
  onToggle: () => void;
}

function UploadIndicator({ collapsed }: { collapsed: boolean }) {
  const tasks = useUploadTasks();
  const activeTasks = tasks.filter(
    (t) => t.status !== "done" && t.status !== "error",
  );

  if (activeTasks.length === 0) return null;

  const task = activeTasks[0];
  const pct = getProgress(task);
  const eta = formatETA(task);
  const isPaused = task.status === "paused";
  const StatusIcon = isPaused ? Pause : Upload;
  const statusLabel = isPaused ? "Paused" : "Uploading";

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mx-2 mb-2 flex justify-center">
            <div className="relative">
              <StatusIcon className={`h-4 w-4 ${isPaused ? "text-amber-500" : "text-primary animate-pulse"}`} />
              <span
                className="absolute -top-1 -right-1.5 h-3 w-3 rounded-full text-[7px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: isPaused ? "#f59e0b" : "#468284" }}
              >
                {activeTasks.length}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <div className="text-xs">
            <p className="font-medium">{statusLabel}: {task.fileName}</p>
            <p>{pct.toFixed(0)}% {eta && `\u00b7 ${eta}`}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="mx-3 mb-2 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${isPaused ? "text-amber-500" : "text-primary animate-pulse"}`} />
        <span className="text-xs font-medium truncate text-sidebar-foreground">
          {task.fileName}
        </span>
      </div>
      <div className="w-full bg-sidebar-border rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-150"
          style={{
            width: `${pct}%`,
            backgroundColor: isPaused ? "#f59e0b" : "var(--primary)",
          }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-sidebar-foreground/50">
        <span>{pct.toFixed(0)}%{isPaused ? " — Paused" : ""}</span>
        <span>{eta}</span>
      </div>
      {activeTasks.length > 1 && (
        <p className="text-[10px] text-sidebar-foreground/50">
          +{activeTasks.length - 1} more upload{activeTasks.length > 2 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export function Sidebar({ userRole, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [contentTypes, setContentTypes] = useState<ContentTypeNav[]>([]);

  useEffect(() => {
    function fetchContentTypes() {
      if (["SUPER_ADMIN", "GAME_MANAGER"].includes(userRole)) {
        api<{ success: boolean; data: ContentTypeNav[] }>("/admin/content-types")
          .then((res) => setContentTypes(res.data))
          .catch(() => {});
      }
    }
    fetchContentTypes();
    // Re-fetch when content types are created/updated/deleted
    window.addEventListener("content-types-changed", fetchContentTypes);
    return () => window.removeEventListener("content-types-changed", fetchContentTypes);
  }, [userRole, pathname]);

  const filteredTop = topItems.filter((item) => item.roles.includes(userRole));
  const filteredBottom = bottomItems.filter((item) => item.roles.includes(userRole));
  const showContent = ["SUPER_ADMIN", "GAME_MANAGER"].includes(userRole);

  function renderLink(item: NavItem) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const link = (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header with brand + collapse toggle */}
        <div className={cn("flex h-16 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "justify-between px-6")}>
          <Link href="/dashboard" className="text-xl font-bold tracking-tight" style={{ color: "#4fb38c" }}>
            {collapsed ? "R" : "ROMHAVEN"}
          </Link>
          <button
            onClick={onToggle}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
            {filteredTop.map(renderLink)}

            {/* Dynamic content type links */}
            {showContent && contentTypes.length > 0 && (
              <>
                <Separator className="my-2 bg-sidebar-border" />
                {!collapsed && (
                  <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-semibold">
                    Content
                  </p>
                )}
                {contentTypes.map((ct) => {
                  const href = `/content/${ct.slug}`;
                  const isActive = pathname === href || pathname.startsWith(href + "/");
                  const Icon = iconMap[ct.icon?.toLowerCase() || ""] || iconMap[ct.slug?.toLowerCase() || ""] || FolderOpen;
                  const link = (
                    <Link
                      key={ct.id}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors overflow-hidden",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{ct.name}</span>}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={ct.id}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {ct.name}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return link;
                })}
                {/* Shared Library link */}
                {(() => {
                  const sharedLink = (
                    <Link
                      href="/content/shared"
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        collapsed && "justify-center px-0",
                        pathname === "/content/shared"
                          ? "bg-sidebar-accent text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <Library className="h-4 w-4 shrink-0" />
                      {!collapsed && "Shared Library"}
                    </Link>
                  );
                  if (collapsed) {
                    return (
                      <Tooltip key="shared">
                        <TooltipTrigger asChild>{sharedLink}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          Shared Library
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return sharedLink;
                })()}
                <Separator className="my-2 bg-sidebar-border" />
              </>
            )}

            {filteredBottom.map(renderLink)}
          </nav>
        </div>
        <UploadIndicator collapsed={collapsed} />
        <div className="border-t border-sidebar-border px-6 py-3">
          <p className="text-xs text-sidebar-foreground/50">{collapsed ? "" : "Admin Panel v1.0"}</p>
        </div>
      </aside>
    </TooltipProvider>
  );
}
