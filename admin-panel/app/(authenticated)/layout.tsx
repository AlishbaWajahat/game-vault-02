"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getStoredUser } from "@/lib/api";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

const SIDEBAR_KEY = "sidebar-collapsed";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const user = getStoredUser();
    if (user) {
      setUserRole(user.role);
    }
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === "true") setCollapsed(true);
    setReady(true);
  }, [router]);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={userRole} collapsed={collapsed} onToggle={toggleSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar userRole={userRole} />
        <main className="flex-1 min-h-0 overflow-y-auto bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
