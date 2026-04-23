import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, FileInput, FileOutput, Bell, Search, Building2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/import-lc", label: "Import LC", icon: FileInput },
  { to: "/export-lc", label: "Export LC", icon: FileOutput },
];

export function AppShell() {
  const location = useLocation();
  const path = location.pathname;

  const crumbs = path
    .split("/")
    .filter(Boolean)
    .map((seg) => seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 py-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-accent)" }}>
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">TradeFlow AI</div>
            <div className="text-[11px] text-sidebar-foreground/60">Virtual Trade Suite</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">Workspace</div>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="px-3 pt-6 pb-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">Coming soon</div>
          {["Import w/o LC", "Export w/o LC", "Guarantees", "SWIFT", "Reporting"].map((m) => (
            <div key={m} className="px-3 py-2 rounded-md text-sm text-sidebar-foreground/40 cursor-not-allowed">
              {m}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center font-semibold text-sidebar-accent-foreground">SK</div>
            <div>
              <div className="text-sidebar-foreground">S. Karim</div>
              <div>Trade Officer · Checker</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center px-6 gap-4">
          <div className="flex items-center text-sm text-muted-foreground gap-1">
            <Link to="/" className="hover:text-foreground">Home</Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" />
                <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>{c}</span>
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search LCs, references, parties…"
                className="pl-9 pr-3 h-9 w-72 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="relative p-2 rounded-md hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}