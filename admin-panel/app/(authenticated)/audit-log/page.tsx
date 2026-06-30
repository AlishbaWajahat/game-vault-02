"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getCache, setCache } from "@/lib/page-cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, string> | null;
  createdAt: string;
  user: { name: string; email: string };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ENTITIES = [
  "content",
  "content_type",
  "content_file",
  "platform",
  "category",
  "article",
  "user",
  "setting",
  "content_request",
  "contact_message",
] as const;

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "UPLOAD_INIT", "UPLOAD_COMPLETE", "BULK_UPDATE"] as const;

const actionStyles: Record<string, React.CSSProperties> = {
  CREATE: { backgroundColor: "#dcfce7", color: "#166534" },
  UPDATE: { backgroundColor: "#dbeafe", color: "#1e40af" },
  DELETE: { backgroundColor: "#fee2e2", color: "#991b1b" },
  UPLOAD_INIT: { backgroundColor: "#f3e8ff", color: "#6b21a8" },
  UPLOAD_COMPLETE: { backgroundColor: "#f3e8ff", color: "#6b21a8" },
  BULK_UPDATE: { backgroundColor: "#dbeafe", color: "#1e40af" },
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditLogPage() {
  const _cached = getCache<{ logs: AuditLog[]; pagination: PaginationData }>("audit-log");
  const [logs, setLogs] = useState<AuditLog[]>(_cached?.logs ?? []);
  const [pagination, setPagination] = useState<PaginationData | null>(_cached?.pagination ?? null);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");

  async function loadData(p = page, entity = filterEntity, action = filterAction) {
    try {
      const params = new URLSearchParams({ page: String(p), limit: "30" });
      if (entity) params.set("entity", entity);
      if (action) params.set("action", action);

      const res = await api<{
        success: boolean;
        data: AuditLog[];
        pagination: PaginationData;
      }>(`/admin/audit-logs?${params}`);

      setLogs(res.data);
      setPagination(res.pagination);
      setCache("audit-log", { logs: res.data, pagination: res.pagination });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(1, "", "");
    function onVisibilityChange() {
      if (document.visibilityState === "visible") loadData();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEntityFilter(entity: string) {
    setFilterEntity(entity);
    setPage(1);
    loadData(1, entity, filterAction);
  }

  function handleActionFilter(action: string) {
    setFilterAction(action);
    setPage(1);
    loadData(1, filterEntity, action);
  }

  function goToPage(p: number) {
    setPage(p);
    loadData(p);
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-lg md:text-2xl font-bold">Audit Log</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-lg md:text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pagination?.total || 0} log entries
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Entity filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">Entity:</span>
          <button
            onClick={() => handleEntityFilter("")}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              filterEntity === ""
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-input"
            }`}
          >
            All
          </button>
          {ENTITIES.map((e) => (
            <button
              key={e}
              onClick={() => handleEntityFilter(e)}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                filterEntity === e
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-input"
              }`}
            >
              {e.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Action filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">Action:</span>
          <button
            onClick={() => handleActionFilter("")}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              filterAction === ""
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-input"
            }`}
          >
            All
          </button>
          {ACTIONS.map((a) => (
            <button
              key={a}
              onClick={() => handleActionFilter(a)}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                filterAction === a
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-input"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No log entries.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Entity
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{log.user.name}</p>
                          <p className="text-[10px] text-muted-foreground">{log.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                          style={actionStyles[log.action]}
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{log.entity.replace(/_/g, " ")}</span>
                        {log.entityId && (
                          <code className="block text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {log.entityId}
                          </code>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.details ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(log.details).map(([k, v]) => (
                              <span
                                key={k}
                                className="text-xs text-muted-foreground"
                              >
                                {k}: <span className="font-medium">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= pagination.totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
