import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, FileText, Upload, Sparkles, ShieldCheck, Send, FileEdit, History,
  ClipboardList, AlertTriangle, Banknote, Truck, Activity, MessageSquare, Eye, Download,
} from "lucide-react";
import { getImportLC } from "@/lib/mock-lc-data";
import type { ImportLC } from "@/lib/lc-types";
import { LCStageStepper } from "@/components/lc/LCStageStepper";
import { StatusBadge, SeverityBadge, ResultBadge } from "@/components/lc/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/import-lc/$id")({
  loader: ({ params }) => {
    const lc = getImportLC(params.id);
    if (!lc) throw notFound();
    return lc;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.reference ?? "Import LC"} — TradeFlow AI` },
      { name: "description", content: `Import LC ${loaderData?.reference} details, documents, compliance and SWIFT messaging.` },
    ],
  }),
  component: ImportLCDetail,
  notFoundComponent: () => (
    <div className="text-center py-20">
      <p className="text-muted-foreground">LC not found.</p>
      <Link to="/import-lc" className="text-primary hover:underline">Back to list</Link>
    </div>
  ),
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

const tabs = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "clauses", label: "Clauses & Terms", icon: ClipboardList },
  { id: "charges", label: "Charges & Margin", icon: Banknote },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "documents", label: "Documents", icon: Upload },
  { id: "ai", label: "AI Scrutiny", icon: Sparkles },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "shipping", label: "Shipping Guarantee", icon: Truck },
  { id: "imp", label: "IMP Payment", icon: Banknote },
  { id: "swift", label: "SWIFT", icon: Send },
  { id: "amendments", label: "Amendments", icon: FileEdit },
  { id: "exceptions", label: "Exceptions", icon: AlertTriangle },
  { id: "audit", label: "Audit Trail", icon: History },
] as const;

function ImportLCDetail() {
  const lc = Route.useLoaderData();
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("overview");

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/import-lc" className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold">{lc.reference}</h1>
            <StatusBadge status={lc.status} />
            <span className="text-xs text-muted-foreground">Issued {lc.issueDate || "—"}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{lc.applicant.name} → {lc.beneficiary.name}</p>
        </div>
        <button className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted inline-flex items-center gap-1.5">
          <FileEdit className="h-4 w-4" /> Initiate Amendment
        </button>
      </div>

      <div className="bg-card rounded-xl border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <LCStageStepper current={lc.status} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="LC Amount" value={fmt(lc.amount, lc.currency)} />
        <Stat label="Utilized" value={fmt(lc.utilized, lc.currency)} sub={`${Math.round((lc.utilized / lc.amount) * 100)}% of LC`} />
        <Stat label="Margin" value={`${lc.marginPercent}%`} sub={fmt(lc.marginAmount, lc.currency)} />
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
          {active === "overview" && <OverviewTab lc={lc} />}
          {active === "clauses" && <ClausesTab lc={lc} />}
          {active === "charges" && <ChargesTab lc={lc} />}
          {active === "approvals" && <ApprovalsTab lc={lc} />}
          {active === "documents" && <DocumentsTab lc={lc} />}
          {active === "ai" && <AITab lc={lc} />}
          {active === "compliance" && <ComplianceTab lc={lc} />}
          {active === "shipping" && <ShippingTab lc={lc} />}
          {active === "imp" && <IMPTab lc={lc} />}
          {active === "swift" && <SwiftTab lc={lc} />}
          {active === "amendments" && <AmendmentsTab lc={lc} />}
          {active === "exceptions" && <ExceptionsTab lc={lc} />}
          {active === "audit" && <AuditTab lc={lc} />}
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

function OverviewTab({ lc }: { lc: ImportLC }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Section title="Applicant">
        <div className="space-y-1">
          <KV k="Name" v={lc.applicant.name} />
          <KV k="Address" v={lc.applicant.address} />
          <KV k="Country" v={lc.applicant.country} />
        </div>
      </Section>
      <Section title="Beneficiary">
        <div className="space-y-1">
          <KV k="Name" v={lc.beneficiary.name} />
          <KV k="Address" v={lc.beneficiary.address} />
          <KV k="Country" v={lc.beneficiary.country} />
          <KV k="Bank" v={lc.beneficiary.bank ?? "—"} />
        </div>
      </Section>
      <Section title="LC Details">
        <div className="space-y-1">
          <KV k="Issuing Bank" v={lc.issuingBank} />
          <KV k="Advising Bank" v={lc.advisingBank} />
          <KV k="Currency / Amount" v={`${lc.currency} ${lc.amount.toLocaleString()}`} />
          <KV k="Tolerance" v={`±${lc.tolerance}%`} />
          <KV k="Payment Terms" v={lc.paymentTerms} />
          <KV k="Incoterm" v={lc.incoterm} />
        </div>
      </Section>
      <Section title="Shipment & Goods">
        <div className="space-y-1">
          <KV k="Goods" v={lc.goods} />
          <KV k="Shipment Date" v={lc.shipmentDate} />
          <KV k="Expiry Date" v={lc.expiryDate} />
        </div>
      </Section>
    </div>
  );
}

function ClausesTab({ lc }: { lc: ImportLC }) {
  return (
    <Section title="Clauses & Special Conditions" action={<button className="text-xs text-primary hover:underline">+ Add from library</button>}>
      {lc.clauses.length === 0 ? (
        <Empty msg="No clauses configured." />
      ) : (
        <div className="space-y-2">
          {lc.clauses.map((c) => (
            <div key={c.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{c.title}</div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{c.category}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ChargesTab({ lc }: { lc: ImportLC }) {
  const total = lc.charges.reduce((s, c) => s + c.amount, 0);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Section title="Margin Lien (posted to CBS)">
        <div className="rounded-md border p-4">
          <div className="flex justify-between items-baseline">
            <div className="text-sm text-muted-foreground">Margin %</div>
            <div className="text-2xl font-semibold">{lc.marginPercent}%</div>
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <div className="text-sm text-muted-foreground">Margin amount</div>
            <div className="text-lg font-medium">{fmt(lc.marginAmount, lc.currency)}</div>
          </div>
        </div>
      </Section>
      <Section title="Charge Breakdown (auto-calculated)">
        <div className="rounded-md border divide-y">
          {lc.charges.map((c, i) => (
            <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
              <span>{c.label}</span>
              <span className="font-medium">{fmt(c.amount, lc.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-2.5 text-sm font-semibold bg-muted/30">
            <span>Total</span>
            <span>{fmt(total, lc.currency)}</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

function ApprovalsTab({ lc }: { lc: ImportLC }) {
  return (
    <Section title="Maker-Checker Workflow">
      <div className="space-y-3">
        {lc.approvals.map((a) => (
          <div key={a.level} className="flex items-start gap-4 rounded-md border p-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
              L{a.level}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{a.role}</span>
                <span className="text-xs text-muted-foreground">· {a.user ?? "Unassigned"}</span>
                <ResultBadge result={a.status} />
              </div>
              {a.comment && <p className="text-xs text-muted-foreground mt-1 italic">"{a.comment}"</p>}
              {a.actedAt && <p className="text-[11px] text-muted-foreground mt-1">{a.actedAt}</p>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function DocumentsTab({ lc }: { lc: ImportLC }) {
  return (
    <Section title="Documents (DMS)" action={<button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"><Upload className="h-3.5 w-3.5" /> Upload</button>}>
      {lc.documents.length === 0 ? (
        <Empty msg="No documents uploaded yet." />
      ) : (
        <div className="rounded-md border divide-y">
          {lc.documents.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center"><FileText className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{d.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">{d.type}</span>
                  {d.ocrConfidence !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-issued/10 text-status-issued inline-flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> OCR {Math.round(d.ocrConfidence * 100)}%
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">v{d.version} · {d.size} · {d.uploadedBy} · {d.uploadedAt}</div>
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

function AITab({ lc }: { lc: ImportLC }) {
  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4 bg-status-issued/5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-status-issued mt-0.5" />
          <div>
            <div className="font-medium text-sm">AI Document Scrutiny</div>
            <p className="text-xs text-muted-foreground mt-1">
              OCR-extracted fields are mapped to LC terms. Officer validation is mandatory before posting.
            </p>
          </div>
        </div>
      </div>
      <Section title="Detected Discrepancies">
        {lc.discrepancies.length === 0 ? (
          <Empty msg="No discrepancies detected by AI." />
        ) : (
          <div className="space-y-2">
            {lc.discrepancies.map((d) => (
              <div key={d.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-status-warning" />
                    <span className="font-medium text-sm">{d.type}</span>
                    <SeverityBadge severity={d.severity} />
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-status-issued/10 text-status-issued">{d.detectedBy}</span>
                  </div>
                  <ResultBadge result={d.status} />
                </div>
                <p className="text-sm text-muted-foreground mt-2">{d.remarks}</p>
                <div className="flex gap-2 mt-3">
                  <button className="text-xs px-3 py-1 rounded-md bg-status-approved text-primary-foreground hover:opacity-90">Confirm</button>
                  <button className="text-xs px-3 py-1 rounded-md border hover:bg-muted">Override with justification</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section title="Manual Scrutiny Checklist">
        <div className="space-y-1.5">
          {["BL date within shipment window", "Invoice amount ≤ LC + tolerance", "Goods description matches LC", "Insurance ≥ 110% CIF", "Beneficiary signature present"].map((c, i) => (
            <label key={i} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-border" defaultChecked={i < 3} />
              {c}
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}

function ComplianceTab({ lc }: { lc: ImportLC }) {
  return (
    <Section title="Sanctions & Compliance Screening" action={<button className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted">Re-run screening</button>}>
      {lc.compliance.length === 0 ? (
        <Empty msg="No screening run yet." />
      ) : (
        <div className="rounded-md border divide-y">
          {lc.compliance.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium">{c.party}</div>
                <div className="text-xs text-muted-foreground">{c.type} · {c.checkedAt}</div>
              </div>
              <ResultBadge result={c.result} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ShippingTab({ lc }: { lc: ImportLC }) {
  return (
    <Section title="Shipping Guarantees" action={<button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">+ Issue SG</button>}>
      {lc.shippingGuarantees.length === 0 ? (
        <Empty msg="No SG issued for this LC." />
      ) : (
        <div className="rounded-md border divide-y">
          {lc.shippingGuarantees.map((sg) => (
            <div key={sg.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium">{sg.reference}</div>
                <div className="text-xs text-muted-foreground">Expiry {sg.expiry}</div>
              </div>
              <div className="text-sm font-medium">{fmt(sg.amount, lc.currency)}</div>
              <ResultBadge result={sg.status === "Active" ? "Clear" : sg.status} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function IMPTab({ lc }: { lc: ImportLC }) {
  if (!lc.imp) return <Empty msg="No IMP record generated yet. Generate from accepted documents." />;
  return (
    <Section title="Import Payment (IMP)" action={<button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Generate MT202</button>}>
      <div className="rounded-md border p-4 space-y-2">
        <KV k="IMP Reference" v={lc.imp.reference} />
        <KV k="Amount" v={fmt(lc.imp.amount, lc.currency)} />
        <KV k="Status" v={<ResultBadge result={lc.imp.status} />} />
        <KV k="Created" v={lc.imp.createdAt} />
      </div>
    </Section>
  );
}

function SwiftTab({ lc }: { lc: ImportLC }) {
  return (
    <Section title="SWIFT Messages" action={<button className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted">+ Queue message</button>}>
      {lc.swiftMessages.length === 0 ? (
        <Empty msg="No SWIFT messages dispatched." />
      ) : (
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

function AmendmentsTab({ lc }: { lc: ImportLC }) {
  return (
    <Section title="Amendment History" action={<button className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">+ New Amendment</button>}>
      {lc.amendments.length === 0 ? (
        <Empty msg="No amendments raised." />
      ) : (
        <div className="rounded-md border divide-y">
          {lc.amendments.map((a) => (
            <div key={a.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{a.field}</div>
                <ResultBadge result={a.status} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="line-through">{a.oldValue}</span> → <span className="text-foreground">{a.newValue}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Requested {a.requestedAt} · Approver {a.approver ?? "—"}</div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ExceptionsTab({ lc }: { lc: ImportLC }) {
  const today = new Date();
  const expiry = new Date(lc.expiryDate);
  const expired = expiry < today;
  const overdrawn = lc.utilized > lc.amount;
  const exceptions = [
    expired && { label: "LC Expired", body: `Expiry date ${lc.expiryDate} has passed.`, sev: "High" as const },
    overdrawn && { label: "Overdrawn LC", body: `Utilized exceeds LC amount by ${fmt(lc.utilized - lc.amount, lc.currency)}.`, sev: "High" as const },
    ...lc.discrepancies.map((d) => ({ label: d.type, body: d.remarks, sev: d.severity })),
  ].filter(Boolean) as { label: string; body: string; sev: "Low" | "Medium" | "High" }[];

  return (
    <Section title="Exceptions">
      {exceptions.length === 0 ? (
        <Empty msg="No active exceptions." />
      ) : (
        <div className="space-y-2">
          {exceptions.map((e, i) => (
            <div key={i} className="rounded-md border p-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-status-warning mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{e.label}</span>
                  <SeverityBadge severity={e.sev} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{e.body}</p>
              </div>
              <button className="text-xs px-3 py-1 rounded-md border hover:bg-muted inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> Justify
              </button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function AuditTab({ lc }: { lc: ImportLC }) {
  return (
    <Section title="Immutable Audit Trail">
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
    </Section>
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