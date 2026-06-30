"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DownloadStats {
  total: number;
  last7d: number;
  last30d: number;
  topContent: {
    id: string;
    title: string;
    slug: string;
    downloads: number;
    contentType?: { id: string; slug: string; name: string };
  }[];
}

interface DownloadLog {
  id: string;
  contentId: string;
  createdAt: string;
  content: { title: string; slug: string };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DownloadsPage() {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [logs, setLogs] = useState<DownloadLog[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  async function loadStats() {
    try {
      const res = await api<{ success: boolean; data: DownloadStats }>("/admin/downloads/stats");
      setStats(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs(p = page) {
    setLogsLoading(true);
    try {
      const res = await api<{
        success: boolean;
        data: DownloadLog[];
        pagination: PaginationData;
      }>(`/admin/downloads/logs?page=${p}&limit=20`);
      setLogs(res.data);
      setPagination(res.pagination);
    } catch {
      // silent
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
    loadLogs(1);
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadStats();
        loadLogs();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToPage(p: number) {
    setPage(p);
    loadLogs(p);
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-7 w-36" />
        <div className="grid gap-3 grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3 md:p-6">
                <Skeleton className="h-7 w-16" />
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
        <h1 className="text-xl md:text-2xl font-bold">Downloads</h1>
        <Card>
          <CardContent className="p-4 md:p-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Total",
      value: formatNumber(stats.total),
      icon: Download,
      color: "#468284",
    },
    {
      label: "7 Days",
      value: formatNumber(stats.last7d),
      icon: TrendingUp,
      color: "#22c55e",
    },
    {
      label: "30 Days",
      value: formatNumber(stats.last30d),
      icon: Calendar,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Downloads</h1>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-[10px] md:text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-3.5 w-3.5 md:h-4 md:w-4" style={{ color: stat.color }} />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Top Content */}
        <Card>
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-sm md:text-base">Top Content</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="space-y-2.5">
              {stats.topContent.length === 0 ? (
                <p className="text-xs md:text-sm text-muted-foreground">No downloads yet</p>
              ) : (
                stats.topContent.map((item, i) => (
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
                    <span className="text-muted-foreground font-mono text-[10px] md:text-xs shrink-0">
                      {formatNumber(item.downloads)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Download Logs */}
        <Card>
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-sm md:text-base">Recent Downloads</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            {logsLoading ? (
              <div className="space-y-2.5">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs md:text-sm text-muted-foreground">No download logs yet</p>
            ) : (
              <div className="space-y-2.5">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs md:text-sm gap-2">
                    <span className="font-medium truncate">
                      {log.content.title}
                    </span>
                    <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 md:h-8 md:w-8"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 md:h-8 md:w-8"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
