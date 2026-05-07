import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, FileText, Upload, Send, History, Repeat, GitBranch, Banknote,
  Truck, Activity, Eye, Download, ShieldCheck, Sparkles, AlertTriangle,
} from "lucide-react";
import { getExportLC } from "@/lib/mock-lc-data";
import type { ExportLC } from "@/lib/lc-types";
import { LCStageStepper } from "@/components/lc/LCStageStepper";
import { StatusBadge, SeverityBadge, ResultBadge } from "@/components/lc/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/export-lc/$id")({
  loader: ({ params }) => {
    const lc = getExportLC(params.id);
    if (!lc) throw notFound();
    return lc;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.reference ?? "Export LC"} — TradeFlow AI` },
      { name: "description", content: `Export LC ${loaderData?.reference} advising, transfers, financing and realization.` },
    ],
  }),
  component: ExportLCDetail,
  notFoundComponent: () => (
    <div className="text-center py-20">
      <p className="text-muted-foreground">Export LC not found.</p>
      <Link to="/export-lc" className="text-primary hover:underline">Back to list</Link>
    </div>
  ),
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

const tabs = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "lien", label: "Lien & Liability", icon: ShieldCheck },
  { id: "transfer", label: "Transfer LC", icon: Repeat },
  { id: "btb", label: "Back-to-Back", icon: GitBranch },
  { id: "finance", label: "Export Finance", icon: Banknote },
  { id: "documents", label: "Documents", icon: Upload },
  { id: "scrutiny", label: "Validation", icon: Sparkles },
  { id: "forwarding", label: "Forwarding", icon: Truck },
  { id: "realization", label: "Realization", icon: Banknote },
  { id: "swift", label: "SWIFT", icon: Send },
  { id: "audit", label: "Audit Trail", icon: History },
] as const;

function ExportLCDetail() {
  const lc = Route.useLoaderData() as ExportLC;
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("overview");
  const realized = lc.realization.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/export-lc" className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold">{lc.reference}</h1>
            <StatusBadge status={lc.status} />
            {lc.isFOC && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">FOC Export</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{lc.applicant.name} → {lc.beneficiary.name}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <LCStageStepper current={lc.status} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="LC Amount" value={fmt(lc.amount, lc.currency)} />
        <Stat label="Realized" value={fmt(realized, lc.currency)} sub={`${lc.amount ? Math.round((realized / lc.amount) * 100) : 0}%`} />
        <Stat label="Lien Marked" value={fmt(lc.lienAmount, lc.currency)} />
        <Stat label="Expiry" value={lc.expiryDate} sub={`Shipment by ${lc.shipmentDate}`} />
      </div>

      <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex overflow-x-auto border-b px-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "px-3 py-3 text-sm font-medium whitespace-nowrap inline-flex items-center gap-1.5 border-b-2 -mb-px transition-colors",
                  active === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="p-6">
          {active === "overview" && <Overview lc={lc} />}
          {active === "lien" && <Lien lc={lc} />}
          {active === "transfer" && <Transfers lc={lc} />}
          {active === "btb" && <BackToBack lc={lc} />}
          {active === "finance" && <Finance lc={lc} />}
          {active === "documents" && <Documents lc={lc} />}
          {active === "scrutiny" && <Scrutiny lc={lc} />}
          {active === "forwarding" && <Forwarding lc={lc} />}
          {active === "realization" && <Realization lc={lc} />}
          {active === "swift" && <Swift lc={lc} />}
          {active === "audit" && <Audit lc={lc} />}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card rounded-xl border p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-sm">{v}</span>
    </div>
  );
}
function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
      <Activity className="h-5 w-5" />
      {msg}
    </div>
  );
}

function Overview({ lc }: { lc: ExportLC }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Section title="Beneficiary (our customer)">
        <KV k="Name" v={lc.beneficiary.name} />
        <KV k="Address" v={lc.beneficiary.address} />
        <KV k="Country" v={lc.beneficiary.country} />
      </Section>
      <Section title="Applicant">
        <KV k="Name" v={lc.applicant.name} />
        <KV k="Country" v={lc.applicant.country} />
      </Section>
      <Section title="LC Details">
        <KV k="Issuing Bank" v={lc.issuingBank} />
        <KV k="Advising Bank" v={lc.advisingBank} />
        <KV k="Currency / Amount" v={`${lc.currency} ${lc.amount.toLocaleString()}`} />
        <KV k="Advice Date" v={lc.adviceDate} />
      </Section>
      <Section title="Shipment & Goods">
        <KV k="Goods" v={lc.goods} />
        <KV k="Shipment Date" v={lc.shipmentDate} />
        <KV k="Expiry Date" v={lc.expiryDate} />
      </Section>
    </div>
  );
}

function Lien({ lc }: { lc: ExportLC }) {
  return (
    <Section title="Lien Marking & Liability Tracking (CBS)">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Lien marked against LC</div>
          <div className="text-2xl font-semibold mt-1">{fmt(lc.lienAmount, lc.currency)}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-xs text-muted-foreground">Customer exposure</div>
          <div className="text-2xl font-semibold mt-1">{fmt(lc.amount, lc.currency)}</div>
          <div className="text-xs text-muted-foreground mt-1">Linked to {lc.beneficiary.name}</div>
        </div>
      </div>
    </Section>
  );
}

function Transfers({ lc }: { lc: ExportLC }) {
  return (
    <Section title="Transfer LC" action={<button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">+ New Transfer</button>}>
      {lc.transfers.length === 0 ? <Empty msg="No transfers initiated." /> : (
        <div className="rounded-md border divide-y">
          {lc.transfers.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium">{t.transferee}</div>
                <div className="text-xs text-muted-foreground">{t.type} · {t.date}</div>
              </div>
              <div className="text-sm font-medium">{fmt(t.amount, lc.currency)}</div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function BackToBack({ lc }: { lc: ExportLC }) {
  if (!lc.backToBack) {
    return (
      <Section title="Back-to-Back LC" action={<button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Create B2B Import LC</button>}>
        <Empty msg="No back-to-back LC linked." />
      </Section>
    );
  }
  return (
    <Section title="Back-to-Back LC">
      <div className="rounded-md border p-4 space-y-2">
        <KV k="Linked Import LC" v={lc.backToBack.reference} />
        <KV k="Amount" v={fmt(lc.backToBack.amount, lc.currency)} />
        <KV k="Status" v={<ResultBadge result={lc.backToBack.status === "Issued" ? "Approved" : lc.backToBack.status} />} />
        <KV k="Master LC value remaining" v={fmt(lc.amount - lc.backToBack.amount, lc.currency)} />
      </div>
    </Section>
  );
}

function Finance({ lc }: { lc: ExportLC }) {
  return (
    <Section title="Export Finance" action={<button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">+ Disburse</button>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {["PC", "FDBP", "LDBP", "SOD", "MDB", "STL", "Bai-Salam"].map((p) => (
          <span key={p} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground text-center">{p}</span>
        ))}
      </div>
      {lc.finance.length === 0 ? <Empty msg="No finance disbursed against this LC." /> : (
        <div className="rounded-md border divide-y">
          {lc.finance.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium">{f.product}</div>
                <div className="text-xs text-muted-foreground">Outstanding {fmt(f.outstanding, lc.currency)}</div>
              </div>
              <div className="text-sm font-medium">{fmt(f.amount, lc.currency)}</div>
              <ResultBadge result={f.status === "Active" ? "Approved" : f.status} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function Documents({ lc }: { lc: ExportLC }) {
  return (
    <Section title="Export Documents" action={<button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"><Upload className="h-3.5 w-3.5" /> Upload</button>}>
      {lc.documents.length === 0 ? <Empty msg="No documents captured." /> : (
        <div className="rounded-md border divide-y">
          {lc.documents.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center"><FileText className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{d.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">{d.type}</span>
                </div>
                <div className="text-xs text-muted-foreground">v{d.version} · {d.size} · {d.uploadedBy}</div>
              </div>
              <button className="p-1.5 rounded hover:bg-muted"><Eye className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-muted"><Download className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function Scrutiny({ lc }: { lc: ExportLC }) {
  return (
    <div className="space-y-6">
      <Section title="Scrutiny Checklist (against LC terms)">
        <div className="space-y-1.5">
          {["Invoice matches LC currency & amount", "Bill of Lading dated within shipment window", "Goods description matches", "Beneficiary details match", "Required certificates attached"].map((c, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-3.5 w-3.5" defaultChecked={i < 4} /> {c}
            </label>
          ))}
        </div>
      </Section>
      <Section title="Discrepancies">
        {lc.discrepancies.length === 0 ? <Empty msg="No discrepancies recorded." /> : (
          <div className="space-y-2">
            {lc.discrepancies.map((d) => (
              <div key={d.id} className="rounded-md border p-3 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-status-warning mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{d.type}</span>
                    <SeverityBadge severity={d.severity} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{d.remarks}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Forwarding({ lc }: { lc: ExportLC }) {
  if (!lc.forwarding) {
    return (
      <Section title="Forwarding Schedule" action={<button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">+ Prepare Schedule</button>}>
        <Empty msg="No forwarding schedule prepared." />
      </Section>
    );
  }
  return (
    <Section title="Forwarding Schedule">
      <div className="rounded-md border p-4">
        <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
          <KV k="Forwarding Bank" v={lc.forwarding.bank} />
          <KV k="Courier" v={lc.forwarding.courier} />
          <KV k="AWB / Tracking" v={lc.forwarding.awb} />
          <KV k="Dispatched" v={lc.forwarding.dispatchedAt} />
        </div>
      </div>
    </Section>
  );
}

function Realization({ lc }: { lc: ExportLC }) {
  const total = lc.realization.reduce((s, r) => s + r.amount, 0);
  return (
    <Section title="Fund Realization (MT940 / MT950)" action={<button className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted">Refresh from CBS</button>}>
      <div className="rounded-md border p-4 mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Total realized</div>
          <div className="text-xl font-semibold">{fmt(total, lc.currency)} <span className="text-sm text-muted-foreground font-normal">of {fmt(lc.amount, lc.currency)}</span></div>
        </div>
        <div className="w-40 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-status-approved" style={{ width: `${lc.amount ? Math.min(100, (total / lc.amount) * 100) : 0}%` }} />
        </div>
      </div>
      {lc.realization.length === 0 ? <Empty msg="No incoming funds linked yet." /> : (
        <div className="rounded-md border divide-y">
          {lc.realization.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium">{r.status} realization</div>
                <div className="text-xs text-muted-foreground">{r.receivedAt}</div>
              </div>
              <div className="text-sm font-medium">{fmt(r.amount, lc.currency)}</div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function Swift({ lc }: { lc: ExportLC }) {
  return (
    <Section title="SWIFT Messages">
      {lc.swiftMessages.length === 0 ? <Empty msg="No SWIFT activity yet." /> : (
        <div className="rounded-md border divide-y">
          {lc.swiftMessages.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-sm flex items-center gap-2">
                  {m.type}
                  <span className="text-xs text-muted-foreground font-normal">{m.reference}</span>
                </div>
                <div className="text-xs text-muted-foreground">{m.createdAt}</div>
              </div>
              <ResultBadge result={m.status} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function Audit({ lc }: { lc: ExportLC }) {
  return (
    <Section title="Audit Trail">
      {lc.audit.length === 0 ? <Empty msg="No activity logged." /> : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          {lc.audit.map((a) => (
            <div key={a.id} className="relative pb-4">
              <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-primary border-2 border-card" />
              <div className="text-sm font-medium">{a.action}</div>
              <div className="text-xs text-muted-foreground">{a.user} · {a.timestamp}</div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}