import { Link, Outlet, createRootRoute, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hydrateAll, isHydrated } from "@/lib/data-store";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TradeFlow AI — Virtual Trade Automation" },
      { name: "description", content: "AI-powered Letter of Credit and trade finance automation for banks." },
      { name: "author", content: "TradeFlow AI" },
      { property: "og:title", content: "TradeFlow AI — Virtual Trade Automation" },
      { property: "og:description", content: "AI-powered Letter of Credit and trade finance automation for banks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "TradeFlow AI — Virtual Trade Automation" },
      { name: "twitter:description", content: "AI-powered Letter of Credit and trade finance automation for banks." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/51d4a5ff-aae1-4895-b565-a73aac4e4784/id-preview-f60fc300--707007d1-71c0-4de2-8bf1-1a184aff8db9.lovable.app-1776959417620.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/51d4a5ff-aae1-4895-b565-a73aac4e4784/id-preview-f60fc300--707007d1-71c0-4de2-8bf1-1a184aff8db9.lovable.app-1776959417620.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });

function Gate() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session && location.pathname !== "/auth") navigate({ to: "/auth" });
    if (session && location.pathname === "/auth") navigate({ to: "/" });
  }, [session, loading, location.pathname, navigate]);

  useEffect(() => {
    if (session && !isHydrated()) {
      hydrateAll();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-sm text-muted-foreground">
        Loading workspace…
      </div>
    );
  }

  if (location.pathname === "/auth") {
    return <Outlet />;
  }

  if (!session) {
    return null;
  }

  return <AppShell />;
}
