import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Filter, ShieldCheck, AlertTriangle } from "lucide-react";
import { guarantees } from "@/lib/mock-guarantees";
import { StatusBadge } from "@/components/lc/StatusBadge";

export const Route = createFileRoute("/guarantees/")({
  head: () => ({
    meta: [
      { title: "Bank Guarantees & SBLCs — TradeFlow AI" },
      { name: "description", content: "Manage Bid Bonds, Performance, Advance Payment, Standby LC and Shipping Guarantees." },
    ],
  }),
  component: GuaranteesList,
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

function GuaranteesList() {
  const totalExposure = guarantees.reduce((s, g) => s + g.amount, 0);
  const invoked = guarantees.filter((g) => g.status === "Invoked").length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Guarantees
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bid Bond, Performance, Advance Payment, Financial, Standby LC, Shipping, Customs & Retention guarantees.
          </p>
        </div>
        <Link to="/guarantees/new" className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Guarantee
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total exposure", value: fmt(totalExposure) },
          { label: "Active", value: guarantees.filter((g) => g.status === "Issued" || g.status === "Amended").length },
          { label: "Invoked", value: invoked, accent: invoked > 0 },
          { label: "Expiring 30d", value: guarantees.filter((g) => new Date(g.expiryDate) < new Date(Date.now() + 30 * 86400000)).length },
          { label: "Cash margin", value: fmt(guarantees.reduce((s, g) => s + g.marginAmount, 0)) },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg border px-4 py-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className={`text-xl font-semibold mt-0.5 ${s.accent ? "text-status-error" : ""}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {invoked > 0 && (
        <div className="rounded-lg border border-status-error/30 bg-status-error/5 px-4 py-3 text-sm flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-status-error mt-0.5" />
          <div>
            <span className="font-medium text-status-error">{invoked} guarantee invocation(s) under review.</span>
            <span className="text-muted-foreground ml-1">Examine demand documents within the URDG/ISP TAT.</span>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search by reference, applicant, beneficiary…" className="pl-9 pr-3 h-9 w-full rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Beneficiary</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Issued / Expiry</th>
                <th className="text-left px-5 py-3 font-medium">Margin</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {guarantees.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <Link to="/guarantees/$id" params={{ id: g.id }} className="font-medium text-primary hover:underline">{g.reference}</Link>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{g.purpose}</div>
                  </td>
                  <td className="px-5 py-3 text-xs">{g.type}</td>
                  <td className="px-5 py-3">{g.beneficiary.name}<div className="text-xs text-muted-foreground">{g.beneficiary.country}</div></td>
                  <td className="px-5 py-3 text-right font-medium">{fmt(g.amount, g.currency)}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{g.issueDate} → {g.expiryDate}</td>
                  <td className="px-5 py-3 text-xs">{g.marginPercent}% · {fmt(g.marginAmount, g.currency)}</td>
                  <td className="px-5 py-3"><StatusBadge status={g.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}