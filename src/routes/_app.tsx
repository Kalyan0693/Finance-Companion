import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Repeat, Users, LogOut, Plus, Search,
} from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", Icon: ArrowLeftRight },
  { to: "/buckets", label: "Buckets", Icon: Wallet },
  { to: "/recurring", label: "Recurring", Icon: Repeat },
  { to: "/groups", label: "Team", Icon: Users },
] as const;

function AppLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const logout = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground min-h-screen sticky top-0 border-r border-sidebar-border">
          <div className="px-5 py-5 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-sm font-bold">L</div>
            <span className="font-display text-lg font-bold tracking-tight">Ledger</span>
          </div>

          <div className="px-4 pt-2 pb-3">
            <Link
              to="/transactions"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-deep transition"
            >
              <Plus className="h-4 w-4" /> Add Expense
            </Link>
          </div>

          <nav className="px-3 mt-2 space-y-1">
            {NAV.map(({ to, label, Icon }) => {
              const active = path === to || path.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-3 py-4 border-t border-sidebar-border">
            <div className="px-3 py-2 text-xs text-sidebar-foreground/60 truncate">
              {user.email}
            </div>
            <button
              onClick={logout}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground font-display text-sm font-bold">L</div>
            <span className="font-display font-bold">Ledger</span>
          </div>
          <button onClick={logout} className="text-xs opacity-80">Sign out</button>
        </div>

        <main className="flex-1 min-w-0 pt-14 md:pt-0">
          {/* Desktop topbar with search */}
          <div className="hidden md:flex sticky top-0 z-20 items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-8 py-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search transactions…"
                className="w-full rounded-lg bg-card border border-border pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="text-xs text-muted-foreground rounded-lg border border-border bg-card px-3 py-2">
              {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-8">
            <Outlet />
          </div>
          {/* Mobile bottom nav */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
            {NAV.map(({ to, label, Icon }) => {
              const active = path === to || path.startsWith(to + "/");
              return (
                <Link key={to} to={to} className={`flex flex-col items-center py-2 text-[10px] ${active ? "text-primary" : "text-sidebar-foreground/70"}`}>
                  <Icon className="h-4 w-4 mb-0.5" /> {label}
                </Link>
              );
            })}
          </nav>
          <div className="h-16 md:hidden" />
        </main>
      </div>
    </div>
  );
}
