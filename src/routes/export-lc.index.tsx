import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Filter, FileOutput } from "lucide-react";
import { exportLCs } from "@/lib/mock-lc-data";
import { StatusBadge } from "@/components/lc/StatusBadge";

export const Route = createFileRoute("/export-lc/")({
  head: () => ({
    meta: [
      { title: "Export LCs — TradeFlow AI" },
      { name: "description", content: "Advise, transfer, finance and settle export Letters of Credit." },
    ],
  }),
  component: ExportLCList,
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

function ExportLCList() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileOutput className="h-6 w-6 text-primary" />
            Export LC Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Advising, transfer, back-to-back, financing, document scrutiny, forwarding and realization.
          </p>
        </div>
        <Link
          to="/export-lc/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Advise New LC
        </Link>
      </div>

      <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search by reference or applicant…" className="pl-9 pr-3 h-9 w-full rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
                <th className="text-left px-5 py-3 font-medium">Applicant</th>
                <th className="text-left px-5 py-3 font-medium">Issuing Bank</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
                <th className="text-right px-5 py-3 font-medium">Realized</th>
                <th className="text-left px-5 py-3 font-medium">Expiry</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exportLCs.map((lc) => {
                const realized = lc.realization.reduce((s, r) => s + r.amount, 0);
                return (
                  <tr key={lc.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Link to="/export-lc/$id" params={{ id: lc.id }} className="font-medium text-primary hover:underline">
                        {lc.reference}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {lc.beneficiary.name} · {lc.goods}{lc.isFOC && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted">FOC</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">{lc.applicant.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{lc.issuingBank}</td>
                    <td className="px-5 py-3 text-right font-medium">{fmt(lc.amount, lc.currency)}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{fmt(realized, lc.currency)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{lc.expiryDate}</td>
                    <td className="px-5 py-3"><StatusBadge status={lc.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}