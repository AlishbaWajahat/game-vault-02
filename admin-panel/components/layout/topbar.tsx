"use client";

import { useRouter } from "next/navigation";
import { logout, getStoredUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSidebar } from "./mobile-sidebar";
import { LogOut, ChevronDown } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  CONTENT_MANAGER: "Content Manager",
  GAME_MANAGER: "Game Manager",
};

interface TopbarProps {
  userRole: string;
}

export function Topbar({ userRole }: TopbarProps) {
  const router = useRouter();
  const user = getStoredUser();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-30 flex h-12 md:h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-3 md:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebar userRole={userRole} />
        <span className="md:hidden text-sm font-bold" style={{ color: "#4fb38c" }}>ROMHAVEN</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2">
            <Avatar className="h-7 w-7 md:h-8 md:w-8">
              <AvatarFallback className="text-[10px] md:text-xs bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-sm font-medium">{user?.name || "Admin"}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {ROLE_LABELS[userRole] || userRole}
              </Badge>
            </div>
            <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user?.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
