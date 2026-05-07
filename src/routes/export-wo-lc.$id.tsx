import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText, Upload, Sparkles, ShieldCheck, Send, History, Banknote, Activity, Eye, Download } from "lucide-react";
import { getExportWoLC } from "@/lib/mock-export-wo-lc";
import type { ExportWoLC } from "@/lib/export-wo-lc-types";
import { StatusBadge, ResultBadge } from "@/components/lc/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/export-wo-lc/$id")({
  loader: ({ params }) => {
    const lc = getExportWoLC(params.id);
    if (!lc) throw notFound();
    return lc;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.reference ?? "Export w/o LC"} — TradeFlow AI` },
      { name: "description", content: `Export without LC ${loaderData?.reference} – documents, EXP filing and realization.` },
    ],
  }),
  component: ExportWoLCDetail,
  notFoundComponent: () => (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Transaction not found.</p>
      <Link to="/export-wo-lc" className="text-primary hover:underline">Back to list</Link>
    </div>
  ),
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

const tabs = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "documents", label: "Documents", icon: Upload },
  { id: "ai", label: "AI Scrutiny", icon: Sparkles },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "exp", label: "EXP & Forex", icon: Banknote },
  { id: "finance", label: "Export Finance", icon: Banknote },
  { id: "realization", label: "Realization", icon: Banknote },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "swift", label: "SWIFT", icon: Send },
  { id: "charges", label: "Charges", icon: Banknote },
  { id: "audit", label: "Audit Trail", icon: History },
] as const;

function ExportWoLCDetail() {
  const lc = Route.useLoaderData() as ExportWoLC;
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("overview");
  const realized = (lc.realization ?? []).reduce((s, r) => s + r.amount, 0) || lc.realizedAmount;
  const pending = lc.invoiceAmount - realized;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/export-wo-lc" className="p-2 rounded-md hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold">{lc.reference}</h1>
            <StatusBadge status={lc.status} />
            <span className="text-xs text-muted-foreground">{lc.mode}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{lc.exporter.name} → {lc.buyer.name}</p>
        </div>
        {lc.status !== "Realized" && lc.status !== "Closed" && (
          <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 inline-flex items-center gap-1.5">
            <Banknote className="h-4 w-4" /> Record Realization
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Invoice value", value: fmt(lc.invoiceAmount, lc.currency) },
          { label: "Realized", value: fmt(realized, lc.currency) },
          { label: "Pending", value: fmt(pending, lc.currency) },
          { label: "EXP status", value: lc.exp.status },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg border px-4 py-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-lg font-semibold mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {tabs.map((t) => {
              const Icon = t.icon;
              const a = active === t.id;
              return (
                <button key={t.id} onClick={() => setActive(t.id)} className={cn("px-4 py-3 text-sm inline-flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors", a ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}>
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-6">
          {active === "overview" && (
            <div className="grid md:grid-cols-2 gap-5 text-sm">
              <Section title="Exporter"><PartyBlock p={lc.exporter} /></Section>
              <Section title="Buyer"><PartyBlock p={lc.buyer} /></Section>
              <Section title="Trade Details">
                <KV k="Invoice #" v={lc.invoiceNumber} />
                <KV k="Invoice Date" v={lc.invoiceDate} />
                <KV k="BL / AWB" v={lc.blNumber || "—"} />
                <KV k="BL Date" v={lc.blDate || "—"} />
                <KV k="Goods" v={lc.goods} />
                <KV k="HS Code" v={lc.hsCode} />
                <KV k="Incoterm" v={lc.incoterm} />
              </Section>
              <Section title="Logistics & Banks">
                <KV k="Destination" v={lc.countryOfDestination} />
                <KV k="POL → POD" v={`${lc.portOfLoading} → ${lc.portOfDischarge}`} />
                <KV k="Remitting Bank" v={lc.remittingBank || "—"} />
                <KV k="Collecting Bank" v={lc.collectingBank || "—"} />
                {lc.dueDate && <KV k="Due Date" v={lc.dueDate} />}
              </Section>
            </div>
          )}
          {active === "documents" && (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/40">
                <tr><th className="text-left px-3 py-2">Document</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Uploaded</th><th className="text-left px-3 py-2">OCR</th><th className="text-right px-3 py-2">Actions</th></tr>
              </thead>
              <tbody className="divide-y">
                {lc.documents.map((d) => (
                  <tr key={d.id}><td className="px-3 py-2 font-medium">{d.name}<div className="text-xs text-muted-foreground">{d.size}</div></td><td className="px-3 py-2">{d.type}</td><td className="px-3 py-2 text-xs">{d.uploadedAt} · {d.uploadedBy}</td><td className="px-3 py-2 text-xs">{d.ocrConfidence ? `${Math.round(d.ocrConfidence * 100)}%` : "—"}</td><td className="px-3 py-2 text-right"><button className="p-1.5 hover:bg-muted rounded"><Eye className="h-4 w-4" /></button><button className="p-1.5 hover:bg-muted rounded"><Download className="h-4 w-4" /></button></td></tr>
                ))}
                {lc.documents.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No documents lodged.</td></tr>}
              </tbody>
            </table>
          )}
          {active === "ai" && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <Sparkles className="h-6 w-6 mx-auto text-status-approved mb-2" />
              AI scrutiny clean — no discrepancies detected on lodged documents.
            </div>
          )}
          {active === "compliance" && (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/40"><tr><th className="text-left px-3 py-2">Party</th><th className="text-left px-3 py-2">Check</th><th className="text-left px-3 py-2">Result</th><th className="text-left px-3 py-2">Checked</th></tr></thead>
              <tbody className="divide-y">{lc.compliance.map((c) => (<tr key={c.id}><td className="px-3 py-2">{c.party}</td><td className="px-3 py-2">{c.type}</td><td className="px-3 py-2"><ResultBadge result={c.result} /></td><td className="px-3 py-2 text-xs text-muted-foreground">{c.checkedAt}</td></tr>))}</tbody>
            </table>
          )}
          {active === "exp" && (
            <div className="grid md:grid-cols-2 gap-5">
              <Section title="EXP Filing">
                <KV k="EXP Reference" v={lc.exp.reference} />
                <KV k="Amount" v={fmt(lc.exp.amount, lc.currency)} />
                <KV k="Status" v={lc.exp.status} />
                <KV k="Filed On" v={lc.exp.createdAt} />
              </Section>
              <Section title="Forex Deal">
                {lc.forexDeal ? (<><KV k="Deal ID" v={lc.forexDeal.dealId} /><KV k="Booked Rate" v={String(lc.forexDeal.rate)} /><KV k="Booked At" v={lc.forexDeal.bookedAt} /></>) : <p className="text-xs text-muted-foreground">No forex deal booked.</p>}
              </Section>
            </div>
          )}
          {active === "finance" && (
            <div>
              {lc.finance ? (
                <div className="grid md:grid-cols-2 gap-5">
                  <Section title="Finance Product">
                    <KV k="Product" v={lc.finance.product} />
                    <KV k="Sanctioned" v={fmt(lc.finance.amount, lc.currency)} />
                    <KV k="Outstanding" v={fmt(lc.finance.outstanding, lc.currency)} />
                    <KV k="Status" v={lc.finance.status} />
                  </Section>
                </div>
              ) : <div className="text-center py-10 text-sm text-muted-foreground">No export finance availed.</div>}
            </div>
          )}
          {active === "realization" && (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/40"><tr><th className="text-left px-3 py-2">Date</th><th className="text-left px-3 py-2">Channel</th><th className="text-right px-3 py-2">Amount</th><th className="text-left px-3 py-2">Status</th></tr></thead>
              <tbody className="divide-y">
                {(lc.realization ?? []).map((r, i) => (<tr key={i}><td className="px-3 py-2">{r.receivedAt}</td><td className="px-3 py-2">{r.channel}</td><td className="px-3 py-2 text-right font-medium">{fmt(r.amount, lc.currency)}</td><td className="px-3 py-2"><ResultBadge result={r.status} /></td></tr>))}
                {(!lc.realization || lc.realization.length === 0) && <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">Awaiting realization.</td></tr>}
              </tbody>
            </table>
          )}
          {active === "approvals" && (
            <div className="space-y-2">
              {lc.approvals.map((a) => (<div key={a.level} className="flex items-center justify-between border rounded-lg px-4 py-3"><div><div className="text-sm font-medium">L{a.level} · {a.role}</div><div className="text-xs text-muted-foreground">{a.user || "Unassigned"} {a.actedAt ? `· ${a.actedAt}` : ""}</div></div><ResultBadge result={a.status} /></div>))}
              {lc.approvals.length === 0 && <p className="text-sm text-muted-foreground">No approvals required.</p>}
            </div>
          )}
          {active === "swift" && (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/40"><tr><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Reference</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Created</th></tr></thead>
              <tbody className="divide-y">{lc.swiftMessages.map((s) => (<tr key={s.id}><td className="px-3 py-2 font-medium">{s.type}</td><td className="px-3 py-2">{s.reference}</td><td className="px-3 py-2"><ResultBadge result={s.status} /></td><td className="px-3 py-2 text-xs">{s.createdAt}</td></tr>))}
                {lc.swiftMessages.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No SWIFT messages.</td></tr>}
              </tbody>
            </table>
          )}
          {active === "charges" && (
            <table className="w-full text-sm"><tbody className="divide-y">
              {lc.charges.map((c, i) => (<tr key={i}><td className="px-3 py-2">{c.label}</td><td className="px-3 py-2 text-right font-medium">{fmt(c.amount, lc.currency)}</td></tr>))}
              <tr className="bg-muted/40 font-semibold"><td className="px-3 py-2">Total</td><td className="px-3 py-2 text-right">{fmt(lc.charges.reduce((s, c) => s + c.amount, 0), lc.currency)}</td></tr>
            </tbody></table>
          )}
          {active === "audit" && (
            <div className="space-y-2">
              {lc.audit.map((a) => (<div key={a.id} className="flex gap-3 text-sm border-l-2 border-primary/30 pl-3 py-1"><Activity className="h-4 w-4 text-muted-foreground mt-0.5" /><div className="flex-1"><div><span className="font-medium">{a.user}</span> · {a.action}</div><div className="text-xs text-muted-foreground">{a.timestamp}</div></div></div>))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</div><div className="space-y-1">{children}</div></div>;
}
function KV({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 text-sm py-1 border-b border-dashed last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-medium text-right">{v}</span></div>;
}
function PartyBlock({ p }: { p: { name: string; address: string; country: string; bank?: string } }) {
  return <div className="text-sm"><div className="font-medium">{p.name}</div><div className="text-muted-foreground text-xs">{p.address}</div><div className="text-muted-foreground text-xs">{p.country}</div>{p.bank && <div className="text-xs mt-1">Bank: {p.bank}</div>}</div>;
}