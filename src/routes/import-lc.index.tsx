import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Filter, FileInput } from "lucide-react";
import { importLCs } from "@/lib/mock-lc-data";
import { StatusBadge } from "@/components/lc/StatusBadge";

export const Route = createFileRoute("/import-lc/")({
  head: () => ({
    meta: [
      { title: "Import LCs — TradeFlow AI" },
      { name: "description", content: "Manage the full lifecycle of import Letters of Credit." },
    ],
  }),
  component: ImportLCList,
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

function ImportLCList() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileInput className="h-6 w-6 text-primary" />
            Import LC Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            End-to-end lifecycle: application, issuance, amendments, document scrutiny, IMP and closure.
          </p>
        </div>
        <Link
          to="/import-lc/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Import LC
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Drafts", value: importLCs.filter((l) => l.status === "Draft").length },
          { label: "Submitted", value: importLCs.filter((l) => l.status === "Submitted").length },
          { label: "Issued", value: importLCs.filter((l) => l.status === "Issued").length },
          { label: "Utilized", value: importLCs.filter((l) => l.status === "Utilized").length },
          { label: "Closed", value: importLCs.filter((l) => l.status === "Closed").length },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg border px-4 py-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-xl font-semibold mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search by reference or beneficiary…" className="pl-9 pr-3 h-9 w-full rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
                <th className="text-left px-5 py-3 font-medium">Beneficiary</th>
                <th className="text-left px-5 py-3 font-medium">Country</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
                <th className="text-right px-5 py-3 font-medium">Utilized</th>
                <th className="text-left px-5 py-3 font-medium">Expiry</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {importLCs.map((lc) => (
                <tr key={lc.id} className="hover:bg-muted/30 cursor-pointer">
                  <td className="px-5 py-3">
                    <Link to="/import-lc/$id" params={{ id: lc.id }} className="font-medium text-primary hover:underline">
                      {lc.reference}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{lc.goods}</div>
                  </td>
                  <td className="px-5 py-3">{lc.beneficiary.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{lc.beneficiary.country}</td>
                  <td className="px-5 py-3 text-right font-medium">{fmt(lc.amount, lc.currency)}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{fmt(lc.utilized, lc.currency)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{lc.expiryDate}</td>
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