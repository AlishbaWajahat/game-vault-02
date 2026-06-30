"use client";

import { useEffect, useState } from "react";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Mail, MailOpen, ChevronLeft, ChevronRight, Filter, Eye } from "lucide-react";
import { toast } from "sonner";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const MESSAGE_STATUSES = ["UNREAD", "READ", "REPLIED", "ARCHIVED"] as const;

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessagesPage() {
  const _cached = getCache<{ messages: ContactMessage[]; pagination: PaginationData }>("messages");
  const [messages, setMessages] = useState<ContactMessage[]>(_cached?.messages ?? []);
  const [pagination, setPagination] = useState<PaginationData | null>(_cached?.pagination ?? null);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");

  // View dialog
  const [viewing, setViewing] = useState<ContactMessage | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadData(p = page, status = filterStatus) {
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (status) params.set("status", status);

      const res = await api<{
        success: boolean;
        data: ContactMessage[];
        pagination: PaginationData;
      }>(`/admin/messages?${params}`);

      setMessages(res.data);
      setPagination(res.pagination);
      setCache("messages", { messages: res.data, pagination: res.pagination });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(1, "");
    function onVisibilityChange() {
      if (document.visibilityState === "visible") loadData();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterChange(status: string) {
    setFilterStatus(status);
    setPage(1);
    loadData(1, status);
  }

  function goToPage(p: number) {
    setPage(p);
    loadData(p);
  }

  async function viewMessage(msg: ContactMessage) {
    // Fetch to auto-mark as read
    try {
      const res = await api<{ success: boolean; data: ContactMessage }>(
        `/admin/messages/${msg.id}`,
      );
      setViewing(res.data);
      // Update status in list
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: "READ" } : m)),
      );
    } catch {
      setViewing(msg);
    }
  }

  async function markStatus(id: string, status: string) {
    try {
      await api(`/admin/messages/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (viewing?.id === id) {
        setViewing((prev) => (prev ? { ...prev, status } : null));
      }
      toast.success(`Marked as ${status.toLowerCase()}`);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m)),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/admin/messages/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Message deleted");
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      if (pagination) setPagination((p) => p ? { ...p, total: p.total - 1 } : null);
      setDeleteTarget(null);
      if (viewing?.id === deleteTarget.id) setViewing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-lg md:text-2xl font-bold">Messages</h1>
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
        <h1 className="text-lg md:text-2xl font-bold">Messages</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
          {pagination?.total || 0} messages
        </p>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
        <button
          onClick={() => handleFilterChange("")}
          className={`rounded-md border px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm transition-colors ${
            filterStatus === ""
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background hover:bg-muted border-input"
          }`}
        >
          All
        </button>
        {MESSAGE_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleFilterChange(s)}
            className={`rounded-md border px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm transition-colors ${
              filterStatus === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-input"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {messages.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No messages.</p>
            </div>
          ) : (
            <div className="divide-y">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start justify-between px-4 py-3 gap-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                    msg.status === "UNREAD" ? "bg-primary/5" : ""
                  }`}
                  onClick={() => viewMessage(msg)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {msg.status === "UNREAD" ? (
                      <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#468284" }} />
                    ) : (
                      <MailOpen className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm truncate max-w-[300px] ${msg.status === "UNREAD" ? "font-semibold" : "font-medium"}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {msg.name} &lt;{msg.email}&gt;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      style={
                        msg.status === "UNREAD"
                          ? { backgroundColor: "#dbeafe", color: "#1e40af" }
                          : undefined
                      }
                    >
                      {msg.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDate(msg.createdAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(msg);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
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

      {/* View Message Dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.subject}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{viewing.name}</span>
                  <span className="text-muted-foreground"> &lt;{viewing.email}&gt;</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(viewing.createdAt)}
                </span>
              </div>
              <div className="rounded-md bg-muted/50 p-4 text-sm whitespace-pre-wrap">
                {viewing.message}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {MESSAGE_STATUSES.map((s) => (
                  <Button
                    key={s}
                    variant={viewing.status === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => markStatus(viewing.id, s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Delete message from &quot;{deleteTarget?.name}&quot; about &quot;{deleteTarget?.subject}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
