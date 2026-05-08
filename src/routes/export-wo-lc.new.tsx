import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileOutput } from "lucide-react";
import { useState } from "react";
import { createRecord } from "@/lib/data-store";
import { exportWoLCs } from "@/lib/mock-export-wo-lc";
import type { ExportWoLC, ExportWoLCMode } from "@/lib/export-wo-lc-types";

export const Route = createFileRoute("/export-wo-lc/new")({
  head: () => ({
    meta: [
      { title: "New Export w/o LC — TradeFlow AI" },
      { name: "description", content: "Initiate a new export without LC transaction." },
    ],
  }),
  component: NewExportWoLC,
});

const modes: { id: string; label: ExportWoLCMode; desc: string }[] = [
  { id: "dp", label: "Documentary Collection - DP", desc: "Documents handed to collecting bank, released against payment." },
  { id: "da", label: "Documentary Collection - DA", desc: "Documents released against acceptance of usance bill of exchange." },
  { id: "tt", label: "Advance Receipt / TT", desc: "Inward remittance received before shipment." },
  { id: "oa", label: "Open Account", desc: "Goods shipped against agreed credit terms with buyer." },
  { id: "consign", label: "Consignment", desc: "Goods sent on consignment, realized on sale." },
];

function NewExportWoLC() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ exporter: "", buyer: "", buyerCountry: "", invoice: "", invoiceDate: "", currency: "USD", amount: "", hsCode: "", incoterm: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function save() {
    if (!mode) return;
    setBusy(true);
    try {
      const amount = Number(f.amount.replace(/[^\d.]/g, "")) || 0;
      const m = modes.find((x) => x.id === mode)!.label;
      const ref = `EWLC-${new Date().getFullYear()}-${String(exportWoLCs.length + 1).padStart(5, "0")}`;
      const rec: ExportWoLC = {
        id: crypto.randomUUID(), reference: ref, mode: m,
        exporter: { name: f.exporter, address: "", country: "Bangladesh" },
        buyer: { name: f.buyer, address: "", country: f.buyerCountry },
        currency: f.currency, invoiceAmount: amount, realizedAmount: 0,
        invoiceDate: f.invoiceDate || new Date().toISOString().slice(0, 10),
        invoiceNumber: f.invoice, goods: "", hsCode: f.hsCode, incoterm: f.incoterm,
        countryOfDestination: f.buyerCountry, portOfLoading: "", portOfDischarge: "",
        status: "Draft", documents: [], compliance: [], swiftMessages: [], approvals: [], audit: [],
        exp: { reference: `EXP-${Date.now()}`, amount, status: "Pending", createdAt: new Date().toISOString() },
        charges: [],
      };
      await createRecord("export_wo_lcs", rec, exportWoLCs);
      navigate({ to: "/export-wo-lc" });
    } catch (e) { alert((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/export-wo-lc" className="p-2 rounded-md hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><FileOutput className="h-5 w-5 text-primary" /> New Export w/o LC</h1>
          <p className="text-sm text-muted-foreground">Choose a transaction mode to begin.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {modes.map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)} className={`text-left bg-card border rounded-xl p-4 hover:border-primary transition-colors ${mode === m.id ? "border-primary ring-2 ring-primary/20" : ""}`} style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="font-medium text-sm">{m.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
          </button>
        ))}
      </div>

      {mode && (
        <div className="bg-card border rounded-xl p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-semibold text-sm">Transaction details</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field label="Exporter" placeholder="Beneficiary / exporter name" value={f.exporter} onChange={set("exporter")} />
            <Field label="Buyer" placeholder="Overseas buyer name" value={f.buyer} onChange={set("buyer")} />
            <Field label="Invoice #" placeholder="EXP-XXXX" value={f.invoice} onChange={set("invoice")} />
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