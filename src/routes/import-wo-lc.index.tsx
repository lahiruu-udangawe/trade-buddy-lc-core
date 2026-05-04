import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Filter, FileStack, AlertTriangle } from "lucide-react";
import { importWoLCs } from "@/lib/mock-import-wo-lc";
import { StatusBadge } from "@/components/lc/StatusBadge";

export const Route = createFileRoute("/import-wo-lc/")({
  head: () => ({
    meta: [
      { title: "Import Without LC — TradeFlow AI" },
      { name: "description", content: "Manage import transactions on Collection, TT, Open Account and Consignment basis." },
    ],
  }),
  component: ImportWoLCList,
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

function ImportWoLCList() {
  const overdue = importWoLCs.filter((l) => l.status === "Overdue").length;
  const totals = importWoLCs.reduce((s, l) => s + l.invoiceAmount, 0);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileStack className="h-6 w-6 text-primary" />
            Import Without LC
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Documentary collection (DP/DA), Advance TT, Open Account and Consignment imports — with IMP filing & compliance.
          </p>
        </div>
        <Link
          to="/import-wo-lc/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Transaction
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total exposure", value: fmt(totals) },
          { label: "Lodged (DP/DA)", value: importWoLCs.filter((l) => l.status === "Lodged" || l.status === "Accepted").length },
          { label: "Paid / Settled", value: importWoLCs.filter((l) => l.status === "Paid").length },
          { label: "Overdue", value: overdue, accent: overdue > 0 },
          { label: "IMP pending", value: importWoLCs.filter((l) => l.imp.status === "Pending").length },
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
            <span className="font-medium text-status-error">{overdue} transaction(s) overdue.</span>
            <span className="text-muted-foreground ml-1">AI flagged these for follow-up with the applicant and supplier.</span>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search by reference, supplier, invoice…" className="pl-9 pr-3 h-9 w-full rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
                <th className="text-left px-5 py-3 font-medium">Supplier</th>
                <th className="text-right px-5 py-3 font-medium">Invoice</th>
                <th className="text-left px-5 py-3 font-medium">Due / Tenor</th>
                <th className="text-left px-5 py-3 font-medium">IMP</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {importWoLCs.map((lc) => (
                <tr key={lc.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <Link to="/import-wo-lc/$id" params={{ id: lc.id }} className="font-medium text-primary hover:underline">
                      {lc.reference}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{lc.goods}</div>
                  </td>
                  <td className="px-5 py-3 text-xs">{lc.mode}</td>
                  <td className="px-5 py-3">
                    {lc.supplier.name}
                    <div className="text-xs text-muted-foreground">{lc.supplier.country}</div>
                  </td>
                  <td className="px-5 py-3 text-right font-medium">{fmt(lc.invoiceAmount, lc.currency)}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {lc.dueDate ? `${lc.dueDate} · ${lc.tenorDays}d` : lc.invoiceDate}
                  </td>
                  <td className="px-5 py-3 text-xs">{lc.imp.reference}<div className="text-muted-foreground">{lc.imp.status}</div></td>
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