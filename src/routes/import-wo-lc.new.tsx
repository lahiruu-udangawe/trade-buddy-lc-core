import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileStack } from "lucide-react";
import { useState } from "react";
import { createRecord } from "@/lib/data-store";
import { importWoLCs } from "@/lib/mock-import-wo-lc";
import type { ImportWoLC, ImportWoLCMode } from "@/lib/import-wo-lc-types";

export const Route = createFileRoute("/import-wo-lc/new")({
  head: () => ({
    meta: [
      { title: "New Import w/o LC — TradeFlow AI" },
      { name: "description", content: "Initiate a new import without LC transaction." },
    ],
  }),
  component: NewImportWoLC,
});

const modes: { id: string; label: ImportWoLCMode; desc: string }[] = [
  { id: "dp", label: "Documentary Collection - DP", desc: "Documents released against payment at sight." },
  { id: "da", label: "Documentary Collection - DA", desc: "Documents released against acceptance of usance bill." },
  { id: "tt", label: "Advance Payment / TT", desc: "Outward remittance against PI before shipment." },
  { id: "oa", label: "Open Account", desc: "Settlement after shipment based on agreed credit terms." },
  { id: "consign", label: "Consignment", desc: "Goods sent on consignment, paid on sale." },
];

function NewImportWoLC() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ applicant: "", supplier: "", supplierCountry: "", invoice: "", invoiceDate: "", currency: "USD", amount: "", hsCode: "", incoterm: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function save() {
    if (!mode) return;
    setBusy(true);
    try {
      const amount = Number(f.amount.replace(/[^\d.]/g, "")) || 0;
      const ref = `IWLC-${new Date().getFullYear()}-${String(importWoLCs.length + 1).padStart(5, "0")}`;
      const m = modes.find((x) => x.id === mode)!.label;
      const rec: ImportWoLC = {
        id: crypto.randomUUID(), reference: ref, mode: m,
        applicant: { name: f.applicant, address: "", country: "Bangladesh" },
        supplier: { name: f.supplier, address: "", country: f.supplierCountry },
        currency: f.currency, invoiceAmount: amount, paidAmount: 0,
        invoiceDate: f.invoiceDate || new Date().toISOString().slice(0, 10),
        invoiceNumber: f.invoice, goods: "", hsCode: f.hsCode, incoterm: f.incoterm,
        countryOfOrigin: f.supplierCountry, portOfLoading: "", portOfDischarge: "",
        status: "Draft", documents: [], discrepancies: [], compliance: [],
        swiftMessages: [], approvals: [], audit: [],
        imp: { reference: `IMP-${Date.now()}`, amount, status: "Pending", createdAt: new Date().toISOString() },
        charges: [],
      };
      await createRecord("import_wo_lcs", rec, importWoLCs);
      navigate({ to: "/import-wo-lc" });
    } catch (e) { alert((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/import-wo-lc" className="p-2 rounded-md hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><FileStack className="h-5 w-5 text-primary" /> New Import w/o LC</h1>
          <p className="text-sm text-muted-foreground">Choose a transaction mode to begin.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`text-left bg-card border rounded-xl p-4 hover:border-primary transition-colors ${mode === m.id ? "border-primary ring-2 ring-primary/20" : ""}`}
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="font-medium text-sm">{m.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
          </button>
        ))}
      </div>

      {mode && (
        <div className="bg-card border rounded-xl p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-semibold text-sm">Transaction details</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field label="Applicant" placeholder="Importer name" value={f.applicant} onChange={set("applicant")} />
            <Field label="Supplier" placeholder="Beneficiary / supplier name" value={f.supplier} onChange={set("supplier")} />
            <Field label="Invoice #" placeholder="INV-XXXX" value={f.invoice} onChange={set("invoice")} />
            <Field label="Invoice date" type="date" value={f.invoiceDate} onChange={set("invoiceDate")} />
            <Field label="Currency" placeholder="USD" value={f.currency} onChange={set("currency")} />
            <Field label="Invoice amount" placeholder="0.00" value={f.amount} onChange={set("amount")} />
            <Field label="HS code" placeholder="0000.00" value={f.hsCode} onChange={set("hsCode")} />
            <Field label="Incoterm" placeholder="FOB / CFR / CIF" value={f.incoterm} onChange={set("incoterm")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setMode(null)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
            <button onClick={save} disabled={busy} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">Save Draft</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, placeholder, type = "text", value, onChange }: { label: string; placeholder?: string; type?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}