"use client";

import { useEffect, useState } from "react";
import { api, getStoredUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, Download, FileText, ClipboardList, TrendingUp, Activity, BarChart3, PieChart as PieChartIcon, MessageSquare } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface DashboardStats {
  totalContent: number;
  totalPlatforms: number;
  totalCategories: number;
  totalDownloads?: number;
  pendingRequests?: number;
  recentDownloads?: number;
  totalArticles?: number;
  unreadMessages?: number;
  totalUsers?: number;
  totalContentTypes?: number;
  totalSites?: number;
  downloadChart?: Array<{ date: string; count: number }>;
  contentByType?: Array<{ name: string; count: number }>;
  topContent?: ContentItem[];
}

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  downloads: number;
  isPublished: boolean;
  contentType?: { id: string; slug: string; name: string };
}

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  details: Record<string, string>;
  createdAt: string;
  user: { name: string; role?: string };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topContent, setTopContent] = useState<ContentItem[]>([]);
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (user) setUserRole(user.role);

    async function load() {
      try {
        const dashRes = await api<{ success: boolean; data: DashboardStats }>("/admin/dashboard");
        setStats(dashRes.data);
        setTopContent(dashRes.data.topContent || []);

        // Recent activity (backend scopes by role automatically)
        try {
          const auditRes = await api<{ success: boolean; data: AuditEntry[] }>(
            "/admin/audit-logs?limit=8",
          );
          setActivity(auditRes.data);
        } catch {
          // Not authorized — skip
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
    function onVisibilityChange() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <Skeleton className="h-7 w-14" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load dashboard: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const isAdmin = userRole === "SUPER_ADMIN";
  const isGameManager = userRole === "GAME_MANAGER";
  const isContentManager = userRole === "CONTENT_MANAGER";

  const allStatCards = [
    {
      label: "Total Content",
      value: stats.totalContent,
      sub: `${stats.totalPlatforms} platforms, ${stats.totalCategories} genres`,
      icon: Layers,
      color: "#468284",
      show: isAdmin || isGameManager,
    },
    {
      label: "Downloads",
      value: formatNumber(stats.totalDownloads ?? 0),
      sub: stats.recentDownloads !== undefined ? `${stats.recentDownloads} this week` : "all time",
      icon: Download,
      color: "#22c55e",
      show: isAdmin || isGameManager,
    },
    {
      label: "Articles",
      value: stats.totalArticles ?? 0,
      sub: "published",
      icon: FileText,
      color: "#f59e0b",
      show: isAdmin || isContentManager,
    },
    {
      label: "Pending",
      value: stats.pendingRequests ?? 0,
      sub: "requests",
      icon: ClipboardList,
      color: "#ef4444",
      show: isAdmin || isGameManager,
    },
    {
      label: "Messages",
      value: stats.unreadMessages ?? 0,
      sub: "unread messages",
      icon: MessageSquare,
      color: "#ef4444",
      show: isContentManager,
    },
  ];

  const statCards = allStatCards.filter((s) => s.show);

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>

      <div className={cn(
        "grid gap-3 grid-cols-2",
        statCards.length >= 4 ? "lg:grid-cols-4" : statCards.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2",
      )}>
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-3.5 w-3.5 md:h-4 md:w-4" style={{ color: stat.color }} />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 truncate">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {(stats.downloadChart || stats.contentByType) && (
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
          {stats.downloadChart && stats.downloadChart.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 p-3 md:p-6">
                <BarChart3 className="h-4 w-4 shrink-0" style={{ color: "#468284" }} />
                <CardTitle className="text-sm md:text-base">Downloads (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={200} minWidth={280}>
                    <BarChart data={stats.downloadChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(d: string) => new Date(d + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={30} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                        wrapperStyle={{ zIndex: 1000, top: 0, left: "50%", transform: "translateX(-50%)" }}
                        cursor={{ fill: "rgba(70,130,132,0.1)" }}
                        allowEscapeViewBox={{ x: true, y: true }}
                        labelFormatter={(d) => new Date(String(d) + "T00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                      />
                      <Bar dataKey="count" fill="#468284" radius={[4, 4, 0, 0]} name="Downloads" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.contentByType && stats.contentByType.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 p-3 md:p-6">
                <PieChartIcon className="h-4 w-4 shrink-0" style={{ color: "#468284" }} />
                <CardTitle className="text-sm md:text-base">Content Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={220} minWidth={280}>
                    <PieChart>
                      <Pie
                        data={stats.contentByType}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, value }: { name?: string; value?: number }) => `${name} (${value})`}
                        fontSize={11}
                      >
                        {stats.contentByType.map((_, i) => (
                          <Cell key={i} fill={["#468284", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"][i % 6]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} wrapperStyle={{ zIndex: 1000 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Top Content by Downloads */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 p-3 md:p-6">
            <TrendingUp className="h-4 w-4 shrink-0" style={{ color: "#468284" }} />
            <CardTitle className="text-sm md:text-base">Top Content</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="space-y-2.5">
              {topContent.length === 0 ? (
                <p className="text-xs md:text-sm text-muted-foreground">No content yet</p>
              ) : (
                topContent.map((item, i) => (
                  <div key={item.id} className="flex items-center justify-between text-xs md:text-sm gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <span className="text-muted-foreground w-4 md:w-5 text-right font-mono text-[10px] md:text-xs shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-medium truncate">{item.title}</span>
                      {item.contentType && (
                        <Badge variant="outline" className="text-[9px] md:text-[10px] px-1 md:px-1.5 shrink-0 hidden sm:inline-flex">
                          {item.contentType.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                      <span className="text-muted-foreground font-mono text-[10px] md:text-xs">
                        {formatNumber(item.downloads)}
                      </span>
                      <Badge
                        variant={item.isPublished ? "default" : "secondary"}
                        className="text-[9px] md:text-[10px] px-1 md:px-1.5"
                      >
                        {item.isPublished ? "Live" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 p-3 md:p-6">
            <Activity className="h-4 w-4 shrink-0" style={{ color: "#468284" }} />
            <CardTitle className="text-sm md:text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="space-y-2.5">
              {activity.length === 0 ? (
                <p className="text-xs md:text-sm text-muted-foreground">No recent activity</p>
              ) : (
                activity.map((log) => (
                  <div key={log.id} className="flex items-start justify-between text-xs md:text-sm gap-2">
                    <div className="min-w-0">
                      <span className="font-medium">{log.user.name}</span>
                      {isAdmin && log.user.role && (
                        <Badge
                          variant="outline"
                          className="text-[8px] md:text-[9px] px-1 py-0 ml-1 align-middle hidden sm:inline-flex"
                        >
                          {log.user.role === "SUPER_ADMIN"
                            ? "Admin"
                            : log.user.role === "GAME_MANAGER"
                              ? "Game Mgr"
                              : "Content Mgr"}
                        </Badge>
                      )}{" "}
                      <span className="text-muted-foreground">
                        {log.action.toLowerCase()}d{" "}
                        {log.entity.replace(/_/g, " ")}
                      </span>
                      {log.details?.title || log.details?.name ? (
                        <span className="text-muted-foreground">
                          {" "}&quot;{log.details.title || log.details.name}&quot;
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {timeAgo(log.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
