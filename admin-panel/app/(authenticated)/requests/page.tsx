"use client";

import React, { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { getCache, setCache } from "@/lib/page-cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { toast } from "sonner";

interface ContentTypeRef {
  id: string;
  slug: string;
  name: string;
}

interface ContentRequest {
  id: string;
  title: string;
  platform: string;
  contentTypeId: string | null;
  contentType: ContentTypeRef | null;
  status: string;
  ipHash: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUSES = ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "AVAILABLE"] as const;

const statusStyles: Record<string, React.CSSProperties> = {
  PENDING: { backgroundColor: "#ffedd5", color: "#9a3412" },
  IN_REVIEW: { backgroundColor: "#dbeafe", color: "#1e40af" },
  APPROVED: { backgroundColor: "#dcfce7", color: "#166534" },
  REJECTED: { backgroundColor: "#fee2e2", color: "#991b1b" },
  AVAILABLE: { backgroundColor: "#f3e8ff", color: "#6b21a8" },
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RequestsPage() {
  const _cached = getCache<{ requests: ContentRequest[]; contentTypes: ContentTypeRef[]; pagination: PaginationData }>("requests");
  const [requests, setRequests] = useState<ContentRequest[]>(_cached?.requests ?? []);
  const [contentTypes, setContentTypes] = useState<ContentTypeRef[]>(_cached?.contentTypes ?? []);
  const [pagination, setPagination] = useState<PaginationData | null>(_cached?.pagination ?? null);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTypeId, setFilterTypeId] = useState("");

  // Status update dialog
  const [updateTarget, setUpdateTarget] = useState<ContentRequest | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  async function loadData(p = page, status = filterStatus, typeId = filterTypeId) {
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (status) params.set("status", status);
      if (typeId) params.set("contentTypeId", typeId);

      const [reqRes, ctRes] = await Promise.all([
        api<{
          success: boolean;
          data: ContentRequest[];
          pagination: PaginationData;
        }>(`/admin/requests?${params}`),
        api<{ success: boolean; data: ContentTypeRef[] }>("/admin/content-types"),
      ]);

      setRequests(reqRes.data);
      setPagination(reqRes.pagination);
      setContentTypes(ctRes.data);
      setCache("requests", { requests: reqRes.data, contentTypes: ctRes.data, pagination: reqRes.pagination });
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

  function handleStatusFilter(status: string) {
    setFilterStatus(status);
    setPage(1);
    loadData(1, status, filterTypeId);
  }

  function handleTypeFilter(typeId: string) {
    setFilterTypeId(typeId);
    setPage(1);
    loadData(1, filterStatus, typeId);
  }

  function goToPage(p: number) {
    setPage(p);
    loadData(p);
  }

  function openStatusUpdate(req: ContentRequest) {
    setUpdateTarget(req);
    setNewStatus(req.status);
  }

  async function handleStatusUpdate() {
    if (!updateTarget || !newStatus) return;
    setUpdating(true);
    try {
      await api(`/admin/requests/${updateTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`"${updateTarget.title}" status updated to ${newStatus}`);
      setRequests((prev) =>
        prev.map((r) => r.id === updateTarget.id ? { ...r, status: newStatus } : r),
      );
      setUpdateTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update");
    } finally {
      setUpdating(false);
    }
  }

  async function handleContentTypeChange(requestId: string, contentTypeId: string) {
    try {
      await api(`/admin/requests/${requestId}`, {
        method: "PUT",
        body: JSON.stringify({ contentTypeId: contentTypeId || null }),
      });
      toast.success("Content type updated");
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-7 w-40" />
        <Card>
          <CardContent className="p-3 md:p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
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
        <h1 className="text-xl md:text-2xl font-bold">Content Requests</h1>
        <Card>
          <CardContent className="p-4 md:p-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Content Requests</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          {pagination?.total || 0} requests
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-2 md:space-y-3">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          <span className="text-[10px] md:text-xs text-muted-foreground mr-0.5 md:mr-1">Status:</span>
          <button
            onClick={() => handleStatusFilter("")}
            className={`rounded-md border px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm transition-colors ${
              filterStatus === ""
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-input"
            }`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={`rounded-md border px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm transition-colors ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-input"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Content Type Filter */}
        {contentTypes.length > 0 && (
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            <span className="text-[10px] md:text-xs text-muted-foreground mr-0.5 md:mr-1">Type:</span>
            <button
              onClick={() => handleTypeFilter("")}
              className={`rounded-md border px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm transition-colors ${
                filterTypeId === ""
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-input"
              }`}
            >
              All
            </button>
            {contentTypes.map((ct) => (
              <button
                key={ct.id}
                onClick={() => handleTypeFilter(ct.id)}
                className={`rounded-md border px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm transition-colors ${
                  filterTypeId === ct.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input"
                }`}
              >
                {ct.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {filterStatus || filterTypeId
                  ? "No requests match the current filters."
                  : "No content requests yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Content Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Platform</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3"><span className="font-medium text-sm">{req.title}</span></td>
                        <td className="px-4 py-3">
                          {contentTypes.length > 0 ? (
                            <Select value={req.contentTypeId || "__none__"} onValueChange={(v) => handleContentTypeChange(req.id, v === "__none__" ? "" : v)}>
                              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__"><span className="text-muted-foreground">Assign type</span></SelectItem>
                                {contentTypes.map((ct) => (<SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          ) : req.contentType ? (
                            <Badge variant="secondary">{req.contentType.name}</Badge>
                          ) : (<span className="text-xs text-muted-foreground">—</span>)}
                        </td>
                        <td className="px-4 py-3"><span className="text-sm text-muted-foreground">{req.platform}</span></td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary" style={statusStyles[req.status]}>{req.status.replace("_", " ")}</Badge>
                        </td>
                        <td className="px-4 py-3"><span className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</span></td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => openStatusUpdate(req)}>Update Status</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y">
                {requests.map((req) => (
                  <div key={req.id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm">{req.title}</span>
                      <Badge variant="secondary" className="text-[9px] shrink-0" style={statusStyles[req.status]}>
                        {req.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{req.platform}</span>
                      <span>{formatDate(req.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {contentTypes.length > 0 ? (
                        <Select value={req.contentTypeId || "__none__"} onValueChange={(v) => handleContentTypeChange(req.id, v === "__none__" ? "" : v)}>
                          <SelectTrigger className="h-7 w-[120px] text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__"><span className="text-muted-foreground">Assign type</span></SelectItem>
                            {contentTypes.map((ct) => (<SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      ) : req.contentType ? (
                        <Badge variant="secondary" className="text-[9px]">{req.contentType.name}</Badge>
                      ) : (<span className="text-[11px] text-muted-foreground">No type</span>)}
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openStatusUpdate(req)}>
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={!!updateTarget} onOpenChange={(open) => !open && setUpdateTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm mb-3">
              <span className="text-muted-foreground">Request:</span>{" "}
              <span className="font-medium">{updateTarget?.title}</span>
            </p>
            <div className="space-y-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`w-full text-left rounded-md border px-4 py-2.5 text-sm transition-colors ${
                    newStatus === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateTarget(null)} disabled={updating}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === updateTarget?.status}
            >
              {updating ? "Updating..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
