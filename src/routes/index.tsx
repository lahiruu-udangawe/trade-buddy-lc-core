import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, FileInput, FileOutput, AlertTriangle, ShieldCheck, Sparkles, Activity } from "lucide-react";
import { importLCs, exportLCs } from "@/lib/mock-lc-data";
import { StatusBadge } from "@/components/lc/StatusBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TradeFlow AI" },
      { name: "description", content: "Live overview of Letters of Credit, AI insights, and compliance alerts." },
    ],
  }),
  component: Dashboard,
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

function Dashboard() {
  const totalImport = importLCs.reduce((s, l) => s + l.amount, 0);
  const totalExport = exportLCs.reduce((s, l) => s + l.amount, 0);
  const activeImport = importLCs.filter((l) => l.status === "Issued" || l.status === "Utilized").length;
  const discrepancies = importLCs.flatMap((l) => l.discrepancies).length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elevated)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">LC Management</div>
            <h1 className="text-2xl font-semibold mt-1">Good morning, Sajid</h1>
            <p className="text-sm opacity-80 mt-1 max-w-lg">
              You have 2 LCs awaiting your approval and 1 AI-detected discrepancy needs review.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/import-lc/new" className="inline-flex items-center gap-1.5 rounded-md bg-card text-foreground px-4 py-2 text-sm font-medium hover:bg-card/90">
              New Import LC <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/export-lc" className="inline-flex items-center gap-1.5 rounded-md bg-white/15 text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-white/25 backdrop-blur">
              View Export LCs
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Active Import LCs" value={String(activeImport)} sub={fmt(totalImport)} icon={FileInput} accent />
        <KPI title="Active Export LCs" value={String(exportLCs.length)} sub={fmt(totalExport, "USD")} icon={FileOutput} />
        <KPI title="AI Discrepancies" value={String(discrepancies)} sub="Awaiting review" icon={AlertTriangle} warn />
        <KPI title="Compliance Clear" value="98%" sub="Last 30 days" icon={ShieldCheck} good />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Recent LC Activity</h2>
              <p className="text-xs text-muted-foreground">Most recent transactions across import & export</p>
            </div>
            <Link to="/import-lc" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {[...importLCs.slice(0, 3).map((l) => ({ ...l, kind: "Import" as const })),
              ...exportLCs.slice(0, 2).map((l) => ({ ...l, kind: "Export" as const }))].map((lc) => (
              <Link
                key={lc.id}
                to={lc.kind === "Import" ? "/import-lc/$id" : "/export-lc/$id"}
                params={{ id: lc.id }}
                className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {lc.kind === "Import" ? <FileInput className="h-4 w-4" /> : <FileOutput className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{lc.reference}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">{lc.kind}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {lc.kind === "Import" ? lc.beneficiary.name : lc.applicant.name} · {lc.goods}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{fmt(lc.amount, lc.currency)}</div>
                  <StatusBadge status={lc.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> AI Insights</h2>
          </div>
          <div className="p-5 space-y-4">
            <Insight icon={AlertTriangle} tone="warn" title="Late shipment risk on ILC-2026-00185" body="Document shipment date exceeds LC requirement by 4 days." />
            <Insight icon={ShieldCheck} tone="info" title="Dual-use goods flagged on ILC-2026-00184" body="CNC milling machines require compliance officer approval." />
            <Insight icon={Activity} tone="good" title="OCR completed on 2 new documents" body="Average confidence 94%. Ready for officer validation." />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ title, value, sub, icon: Icon, accent, warn, good }: { title: string; value: string; sub: string; icon: React.ComponentType<{ className?: string }>; accent?: boolean; warn?: boolean; good?: boolean }) {
  const tone = accent ? "text-primary bg-primary/10" : warn ? "text-status-warning bg-status-warning/10" : good ? "text-status-approved bg-status-approved/10" : "text-muted-foreground bg-muted";
  return (
    <div className="bg-card rounded-xl border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{title}</span>
        <div className={`h-7 w-7 rounded-md flex items-center justify-center ${tone}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function Insight({ icon: Icon, tone, title, body }: { icon: React.ComponentType<{ className?: string }>; tone: "warn" | "info" | "good"; title: string; body: string }) {
  const styles = tone === "warn" ? "text-status-warning bg-status-warning/10" : tone === "info" ? "text-status-issued bg-status-issued/10" : "text-status-approved bg-status-approved/10";
  return (
    <div className="flex gap-3">
      <div className={`h-8 w-8 shrink-0 rounded-md flex items-center justify-center ${styles}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
      </div>
    </div>
  );
}
