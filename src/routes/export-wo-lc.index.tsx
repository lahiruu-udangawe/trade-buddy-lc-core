import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Filter, FileOutput, AlertTriangle } from "lucide-react";
import { exportWoLCs } from "@/lib/mock-export-wo-lc";
import { StatusBadge } from "@/components/lc/StatusBadge";

export const Route = createFileRoute("/export-wo-lc/")({
  head: () => ({
    meta: [
      { title: "Export Without LC — TradeFlow AI" },
      { name: "description", content: "Export collections, advance receipts, open account and consignment exports with EXP filing." },
    ],
  }),
  component: ExportWoLCList,
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

function ExportWoLCList() {
  const overdue = exportWoLCs.filter((l) => l.status === "Overdue").length;
  const totals = exportWoLCs.reduce((s, l) => s + l.invoiceAmount, 0);
  const realized = exportWoLCs.reduce((s, l) => s + l.realizedAmount, 0);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileOutput className="h-6 w-6 text-primary" />
            Export Without LC
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Documentary collections (DP/DA), Advance TT, Open Account and Consignment exports with EXP filing & realization tracking.
          </p>
        </div>
        <Link to="/export-wo-lc/new" className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Transaction
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total billed", value: fmt(totals) },
          { label: "Realized", value: fmt(realized) },
          { label: "Lodged / Accepted", value: exportWoLCs.filter((l) => l.status === "Lodged" || l.status === "Accepted" || l.status === "Dispatched").length },
          { label: "Overdue", value: overdue, accent: overdue > 0 },
          { label: "EXP pending", value: exportWoLCs.filter((l) => l.exp.status === "Pending").length },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg border px-4 py-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className={`text-xl font-semibold mt-0.5 ${s.accent ? "text-status-error" : ""}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {overdue > 0 && (
        <div className="rounded-lg border border-status-error/30 bg-status-error/5 px-4 py-3 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-status-error mt-0.5" />
          <div>
            <span className="font-medium text-status-error">{overdue} export realization(s) overdue.</span>
            <span className="text-muted-foreground ml-1">AI flagged these for follow-up with the buyer and collecting bank.</span>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search by reference, buyer, invoice…" className="pl-9 pr-3 h-9 w-full rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm hover:bg-muted">
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Reference</th>
                <th className="text-left px-5 py-3 font-medium">Mode</th>
                <th className="text-left px-5 py-3 font-medium">Buyer</th>
                <th className="text-right px-5 py-3 font-medium">Invoice</th>
                <th className="text-right px-5 py-3 font-medium">Realized</th>
                <th className="text-left px-5 py-3 font-medium">EXP</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exportWoLCs.map((lc) => (
                <tr key={lc.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <Link to="/export-wo-lc/$id" params={{ id: lc.id }} className="font-medium text-primary hover:underline">{lc.reference}</Link>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{lc.goods}</div>
                  </td>
                  <td className="px-5 py-3 text-xs">{lc.mode}</td>
                  <td className="px-5 py-3">{lc.buyer.name}<div className="text-xs text-muted-foreground">{lc.buyer.country}</div></td>
                  <td className="px-5 py-3 text-right font-medium">{fmt(lc.invoiceAmount, lc.currency)}</td>
                  <td className="px-5 py-3 text-right text-xs">{fmt(lc.realizedAmount, lc.currency)}</td>
                  <td className="px-5 py-3 text-xs">{lc.exp.reference}<div className="text-muted-foreground">{lc.exp.status}</div></td>
                  <td className="px-5 py-3"><StatusBadge status={lc.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}