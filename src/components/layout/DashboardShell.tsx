"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  BarChart3,
  FlaskConical,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface DashboardShellProps {
  user: User;
  userName: string;
  isAdmin: boolean;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    href: "/sessions",
    icon: FileText,
    label: "Phiên interview",
    shortLabel: "Sessions",
    matchPrefix: "/sessions",
  },
  {
    href: "/insights",
    icon: BarChart3,
    label: "Insights",
    shortLabel: "Insights",
    matchPrefix: "/insights",
  },
  {
    href: "/product-analysis",
    icon: FlaskConical,
    label: "Product Analysis",
    shortLabel: "Analysis",
    matchPrefix: "/product-analysis",
    adminOnly: true,
  },
  {
    href: "/admin",
    icon: Settings,
    label: "Admin",
    shortLabel: "Admin",
    matchPrefix: "/admin",
    adminOnly: true,
  },
];

export function DashboardShell({
  userName,
  isAdmin,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const isInterviewPage = pathname.includes("/questions");

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Đã đăng xuất");
    router.push("/login");
    router.refresh();
  };

  if (isInterviewPage) {
    return <div className="min-h-screen bg-[var(--bg)]">{children}</div>;
  }

  const visibleNav = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside
        className={`${
          collapsed ? "w-[64px]" : "w-[240px]"
        } bg-[var(--white)] border-r border-[var(--gray-m)] hidden md:flex flex-col transition-all duration-200 shrink-0 sticky top-0 h-screen`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[var(--gray-m)]">
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-[var(--purple)] flex items-center justify-center">
              <span className="text-white text-[12px] font-serif font-bold">
                L
              </span>
            </div>
          ) : (
            <div>
              <h1 className="font-serif text-[16px] text-[var(--text)] leading-tight">
                LMS Tiếng Đức
              </h1>
              <p className="font-mono text-[10px] text-[var(--muted)] uppercase tracking-[0.06em] mt-0.5">
                User Research · v1.2
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.matchPrefix);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors mb-0.5 ${
                  active
                    ? "bg-[var(--purple-l)] text-[var(--purple)] font-medium"
                    : "text-[var(--muted)] hover:bg-[var(--gray-l)] hover:text-[var(--text)]"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Dark mode toggle + Collapse */}
        <div className="px-2 pb-2 space-y-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[var(--muted)] hover:bg-[var(--gray-l)] transition-colors"
            title={theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
          >
            {theme === "light" ? (
              <>
                <Moon className="h-3.5 w-3.5" />
                {!collapsed && <span>Chế độ tối</span>}
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5" />
                {!collapsed && <span>Chế độ sáng</span>}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[var(--muted)] hover:bg-[var(--gray-l)] transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Thu gọn</span>
              </>
            )}
          </button>
        </div>

        {/* User */}
        <div className="border-t border-[var(--gray-m)] p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--purple-l)] flex items-center justify-center shrink-0">
              <span className="text-[12px] font-medium text-[var(--purple)]">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[var(--text)] truncate">
                  {userName}
                </p>
                {isAdmin && (
                  <span className="text-[9px] font-mono text-[var(--purple)] uppercase tracking-wide">
                    Admin
                  </span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 rounded-md hover:bg-[var(--gray-l)] text-[var(--muted)] transition-colors shrink-0"
              title="Đăng xuất"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto pb-16 md:pb-0">
        {children}
      </div>

      {/* Mobile bottom nav — visible on mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--white)] border-t border-[var(--gray-m)] flex md:hidden z-40">
        {visibleNav.map((item) => {
          const active = pathname.startsWith(item.matchPrefix);
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
                active
                  ? "text-[var(--purple)] font-medium"
                  : "text-[var(--muted)]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] text-[var(--muted)] transition-colors"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span>{theme === "light" ? "Tối" : "Sáng"}</span>
        </button>
      </nav>
    </div>
  );
}
