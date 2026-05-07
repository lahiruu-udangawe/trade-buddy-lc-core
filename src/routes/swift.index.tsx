import { createFileRoute, Link } from "@tanstack/react-router";
import { Send, Search, Filter, Inbox, ArrowUpRight, RefreshCw } from "lucide-react";
import { importLCs, exportLCs } from "@/lib/mock-lc-data";
import { importWoLCs } from "@/lib/mock-import-wo-lc";
import { exportWoLCs } from "@/lib/mock-export-wo-lc";
import { guarantees } from "@/lib/mock-guarantees";
import { ResultBadge } from "@/components/lc/StatusBadge";

export const Route = createFileRoute("/swift/")({
  head: () => ({
    meta: [
      { title: "SWIFT Messaging — TradeFlow AI" },
      { name: "description", content: "Unified SWIFT inbox / outbox across LCs, collections, remittances and guarantees." },
    ],
  }),
  component: SwiftHub,
});

type Row = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  reference: string;
  module: string;
  parent: string;
  parentLink: { to: string; params: { id: string } };
  direction: "Outgoing" | "Incoming";
};

function collect(): Row[] {
  const rows: Row[] = [];
  importLCs.forEach((l) => l.swiftMessages.forEach((s) => rows.push({
    ...s, module: "Import LC", parent: l.reference,
    parentLink: { to: "/import-lc/$id", params: { id: l.id } },
    direction: ["MT700", "MT707", "MT202", "pacs.009"].includes(s.type) ? "Outgoing" : "Incoming",
  })));
  exportLCs.forEach((l) => l.swiftMessages.forEach((s) => rows.push({
    ...s, module: "Export LC", parent: l.reference,
    parentLink: { to: "/export-lc/$id", params: { id: l.id } },
    direction: ["MT710", "MT711", "MT740"].includes(s.type) ? "Incoming" : "Outgoing",
  })));
  importWoLCs.forEach((l) => l.swiftMessages.forEach((s) => rows.push({
    ...s, module: "Import w/o LC", parent: l.reference,
    parentLink: { to: "/import-wo-lc/$id", params: { id: l.id } }, direction: "Outgoing",
  })));
  exportWoLCs.forEach((l) => l.swiftMessages.forEach((s) => rows.push({
    ...s, module: "Export w/o LC", parent: l.reference,
    parentLink: { to: "/export-wo-lc/$id", params: { id: l.id } }, direction: "Incoming",
  })));
  guarantees.forEach((g) => g.swiftMessages.forEach((s) => rows.push({
    ...s, module: "Guarantee", parent: g.reference,
    parentLink: { to: "/guarantees/$id", params: { id: g.id } }, direction: "Outgoing",
  })));
  return rows.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

function SwiftHub() {
  const all = collect();
  const out = all.filter((r) => r.direction === "Outgoing").length;
  const inn = all.filter((r) => r.direction === "Incoming").length;
  const queued = all.filter((r) => r.status === "Queued").length;
  const nak = all.filter((r) => r.status === "NAK").length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Send className="h-6 w-6 text-primary" /> SWIFT Messaging
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Unified MT/MX inbox and outbox across all trade products.</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted"><RefreshCw className="h-4 w-4" /> Poll Alliance</button>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm hover:bg-primary/90"><ArrowUpRight className="h-4 w-4" /> Compose MT</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Outgoing", value: out, icon: ArrowUpRight },
          { label: "Incoming", value: inn, icon: Inbox },
          { label: "Queued", value: queued, accent: queued > 0 },
          { label: "NAK / Failed", value: nak, accent: nak > 0 },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg border px-4 py-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className={`text-xl font-semibold mt-0.5 ${s.accent ? "text-status-warning" : ""}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search by reference, MT type…" className="pl-9 pr-3 h-9 w-full rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm hover:bg-muted">
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">MT Type</th>
                <th className="text-left px-5 py-3 font-medium">Direction</th>
                <th className="text-left px-5 py-3 font-medium">Reference</th>
                <th className="text-left px-5 py-3 font-medium">Module</th>
                <th className="text-left px-5 py-3 font-medium">Parent Txn</th>
                <th className="text-left px-5 py-3 font-medium">Created</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {all.map((r) => (
                <tr key={`${r.module}-${r.id}-${r.parent}`} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{r.type}</td>
                  <td className="px-5 py-3 text-xs">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${r.direction === "Outgoing" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent-foreground"}`}>
                      {r.direction}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{r.reference}</td>
                  <td className="px-5 py-3 text-xs">{r.module}</td>
                  <td className="px-5 py-3">
                    <Link to={r.parentLink.to as any} params={r.parentLink.params as any} className="text-primary hover:underline text-sm">{r.parent}</Link>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{r.createdAt}</td>
                  <td className="px-5 py-3"><ResultBadge result={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}