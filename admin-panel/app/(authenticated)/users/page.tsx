"use client";

import React, { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { getCache, setCache } from "@/lib/page-cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES = ["SUPER_ADMIN", "CONTENT_MANAGER", "GAME_MANAGER"] as const;

const roleStyles: Record<string, React.CSSProperties> = {
  SUPER_ADMIN: { backgroundColor: "#f3e8ff", color: "#6b21a8" },
  CONTENT_MANAGER: { backgroundColor: "#dbeafe", color: "#1e40af" },
  GAME_MANAGER: { backgroundColor: "#dcfce7", color: "#166534" },
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UsersPage() {
  const _cached = getCache<{ users: User[] }>("users");
  const [users, setUsers] = useState<User[]>(_cached?.users ?? []);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<string>("GAME_MANAGER");
  const [formActive, setFormActive] = useState(true);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    try {
      const res = await api<{ success: boolean; data: User[] }>("/admin/users");
      setUsers(res.data);
      setCache("users", { users: res.data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    function onVisibilityChange() {
      if (document.visibilityState === "visible") loadData();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("GAME_MANAGER");
    setFormActive(true);
    setDialogOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormActive(user.isActive);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (!editing && !formPassword) {
      toast.error("Password is required for new users");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: formName,
        email: formEmail,
        role: formRole,
        isActive: formActive,
      };
      if (formPassword) body.password = formPassword;

      if (editing) {
        await api(`/admin/users/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success(`"${formName}" updated successfully`);
      } else {
        await api("/admin/users", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(`"${formName}" created successfully`);
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`"${deleteTarget.name}" deleted successfully`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
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
        <h1 className="text-lg md:text-2xl font-bold">Users</h1>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} users</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No users.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-sm">{user.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="secondary"
                          style={roleStyles[user.role]}
                        >
                          {user.role.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Password {!editing && <span className="text-destructive">*</span>}
                {editing && <span className="text-xs text-muted-foreground ml-1">(leave empty to keep current)</span>}
              </Label>
              <Input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editing ? "Leave empty to keep current" : "Password"}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot; ({deleteTarget?.email})?
              This action cannot be undone.
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
