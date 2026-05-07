import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText, Upload, ShieldCheck, Send, History, Banknote, Activity, FileEdit, AlertTriangle, Eye, Download } from "lucide-react";
import { getGuarantee } from "@/lib/mock-guarantees";
import type { Guarantee } from "@/lib/guarantee-types";
import { StatusBadge, ResultBadge } from "@/components/lc/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/guarantees/$id")({
  loader: ({ params }) => {
    const g = getGuarantee(params.id);
    if (!g) throw notFound();
    return g;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.reference ?? "Guarantee"} — TradeFlow AI` },
      { name: "description", content: `Guarantee ${loaderData?.reference} – terms, amendments, invocations and audit trail.` },
    ],
  }),
  component: GuaranteeDetail,
  notFoundComponent: () => (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Guarantee not found.</p>
      <Link to="/guarantees" className="text-primary hover:underline">Back to list</Link>
    </div>
  ),
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

const tabs = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "documents", label: "Documents", icon: Upload },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "amendments", label: "Amendments", icon: FileEdit },
  { id: "invocations", label: "Invocations", icon: AlertTriangle },
  { id: "swift", label: "SWIFT", icon: Send },
  { id: "charges", label: "Charges & Margin", icon: Banknote },
  { id: "audit", label: "Audit Trail", icon: History },
] as const;

function GuaranteeDetail() {
  const g = Route.useLoaderData() as Guarantee;
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("overview");

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/guarantees" className="p-2 rounded-md hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold">{g.reference}</h1>
            <StatusBadge status={g.status} />
            <span className="text-xs text-muted-foreground">{g.type}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{g.applicant.name} → {g.beneficiary.name}</p>
        </div>
        <button className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted inline-flex items-center gap-1.5"><FileEdit className="h-4 w-4" /> Initiate Amendment</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Guarantee value", value: fmt(g.amount, g.currency) },
          { label: "Cash margin", value: `${g.marginPercent}% · ${fmt(g.marginAmount, g.currency)}` },
          { label: "Issue → Expiry", value: `${g.issueDate} → ${g.expiryDate}` },
          { label: "Claim Expiry", value: g.claimExpiryDate || "Same as expiry" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg border px-4 py-3" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-sm font-semibold mt-0.5">{s.value}</div>
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
              <Section title="Applicant"><PartyBlock p={g.applicant} /></Section>
              <Section title="Beneficiary"><PartyBlock p={g.beneficiary} /></Section>
              <Section title="Guarantee Terms">
                <KV k="Type" v={g.type} />
                <KV k="Purpose" v={g.purpose} />
                <KV k="Underlying Contract" v={g.underlyingContract || "—"} />
                <KV k="Issuing Bank" v={g.issuingBank} />
                <KV k="Advising Bank" v={g.advisingBank || "—"} />
              </Section>
              <Section title="Validity & Counter-Guarantee">
                <KV k="Issue Date" v={g.issueDate} />
                <KV k="Expiry Date" v={g.expiryDate} />
                <KV k="Claim Expiry" v={g.claimExpiryDate || "Same as expiry"} />
                <KV k="Counter-Guarantee" v={g.counterGuarantee ? `${g.counterGuarantee.bank} · ${g.counterGuarantee.reference}` : "None"} />
              </Section>
            </div>
          )}
          {active === "documents" && (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/40"><tr><th className="text-left px-3 py-2">Document</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Uploaded</th><th className="text-right px-3 py-2">Actions</th></tr></thead>
              <tbody className="divide-y">
                {g.documents.map((d) => (<tr key={d.id}><td className="px-3 py-2 font-medium">{d.name}<div className="text-xs text-muted-foreground">{d.size}</div></td><td className="px-3 py-2">{d.type}</td><td className="px-3 py-2 text-xs">{d.uploadedAt} · {d.uploadedBy}</td><td className="px-3 py-2 text-right"><button className="p-1.5 hover:bg-muted rounded"><Eye className="h-4 w-4" /></button><button className="p-1.5 hover:bg-muted rounded"><Download className="h-4 w-4" /></button></td></tr>))}
                {g.documents.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">No documents uploaded.</td></tr>}
              </tbody>
            </table>
          )}
          {active === "compliance" && (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/40"><tr><th className="text-left px-3 py-2">Party</th><th className="text-left px-3 py-2">Check</th><th className="text-left px-3 py-2">Result</th><th className="text-left px-3 py-2">Checked</th></tr></thead>
              <tbody className="divide-y">{g.compliance.map((c) => (<tr key={c.id}><td className="px-3 py-2">{c.party}</td><td className="px-3 py-2">{c.type}</td><td className="px-3 py-2"><ResultBadge result={c.result} /></td><td className="px-3 py-2 text-xs text-muted-foreground">{c.checkedAt}</td></tr>))}</tbody>
            </table>
          )}
          {active === "approvals" && (
            <div className="space-y-2">
              {g.approvals.map((a) => (<div key={a.level} className="flex items-center justify-between border rounded-lg px-4 py-3"><div><div className="text-sm font-medium">L{a.level} · {a.role}</div><div className="text-xs text-muted-foreground">{a.user || "Unassigned"} {a.actedAt ? `· ${a.actedAt}` : ""}</div></div><ResultBadge result={a.status} /></div>))}
            </div>
          )}
          {active === "amendments" && (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/40"><tr><th className="text-left px-3 py-2">Field</th><th className="text-left px-3 py-2">Old</th><th className="text-left px-3 py-2">New</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Requested</th></tr></thead>
              <tbody className="divide-y">
                {g.amendments.map((a) => (<tr key={a.id}><td className="px-3 py-2">{a.field}</td><td className="px-3 py-2 text-xs">{a.oldValue}</td><td className="px-3 py-2 text-xs font-medium">{a.newValue}</td><td className="px-3 py-2"><ResultBadge result={a.status} /></td><td className="px-3 py-2 text-xs">{a.requestedAt}</td></tr>))}
                {g.amendments.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No amendments raised.</td></tr>}
              </tbody>
            </table>
          )}
          {active === "invocations" && (
            <div className="space-y-3">
              {(g.invocations ?? []).map((i) => (
                <div key={i.id} className="border rounded-lg p-4 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-status-warning shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap"><span className="font-medium text-sm">Demand for {fmt(i.amount, g.currency)}</span><ResultBadge result={i.status} /></div>
                    <div className="text-xs text-muted-foreground mt-1">Received {i.receivedAt}</div>
                    {i.remarks && <p className="text-sm mt-1">{i.remarks}</p>}
                  </div>
                </div>
              ))}
              {(!g.invocations || g.invocations.length === 0) && <div className="text-center py-10 text-sm text-muted-foreground">No invocations received.</div>}
            </div>
          )}
          {active === "swift" && (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/40"><tr><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Reference</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Created</th></tr></thead>
              <tbody className="divide-y">{g.swiftMessages.map((s) => (<tr key={s.id}><td className="px-3 py-2 font-medium">{s.type}</td><td className="px-3 py-2">{s.reference}</td><td className="px-3 py-2"><ResultBadge result={s.status} /></td><td className="px-3 py-2 text-xs">{s.createdAt}</td></tr>))}</tbody>
            </table>
          )}
          {active === "charges" && (
            <div className="grid md:grid-cols-2 gap-5">
              <Section title="Cash Margin">
                <KV k="Margin %" v={`${g.marginPercent}%`} />
                <KV k="Margin amount" v={fmt(g.marginAmount, g.currency)} />
              </Section>
              <Section title="Charges">
                <table className="w-full text-sm"><tbody className="divide-y">
                  {g.charges.map((c, i) => (<tr key={i}><td className="px-1 py-1.5">{c.label}</td><td className="px-1 py-1.5 text-right font-medium">{fmt(c.amount, g.currency)}</td></tr>))}
                  <tr className="font-semibold"><td className="px-1 py-1.5">Total</td><td className="px-1 py-1.5 text-right">{fmt(g.charges.reduce((s, c) => s + c.amount, 0), g.currency)}</td></tr>
                </tbody></table>
              </Section>
            </div>
          )}
          {active === "audit" && (
            <div className="space-y-2">
              {g.audit.map((a) => (<div key={a.id} className="flex gap-3 text-sm border-l-2 border-primary/30 pl-3 py-1"><Activity className="h-4 w-4 text-muted-foreground mt-0.5" /><div className="flex-1"><div><span className="font-medium">{a.user}</span> · {a.action}</div><div className="text-xs text-muted-foreground">{a.timestamp}</div></div></div>))}
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