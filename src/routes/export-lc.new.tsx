import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { createRecord } from "@/lib/data-store";
import { exportLCs } from "@/lib/mock-lc-data";
import type { ExportLC } from "@/lib/lc-types";

export const Route = createFileRoute("/export-lc/new")({
  head: () => ({
    meta: [
      { title: "Advise Export LC — TradeFlow AI" },
      { name: "description", content: "Capture incoming LC advice (MT710/MT711) and create export LC record." },
    ],
  }),
  component: NewExportLC,
});

function NewExportLC() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ reference: "", issuingBank: "", applicant: "", beneficiary: "", currency: "EUR", amount: "", shipmentDate: "", expiryDate: "", goods: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    try {
      const amount = Number(f.amount.replace(/[^\d.]/g, "")) || 0;
      const ref = f.reference || `ELC-${new Date().getFullYear()}-${String(exportLCs.length + 1).padStart(5, "0")}`;
      const rec: ExportLC = {
        id: crypto.randomUUID(), reference: ref,
        beneficiary: { name: f.beneficiary, address: "", country: "Bangladesh" },
        applicant: { name: f.applicant, address: "", country: "" },
        issuingBank: f.issuingBank, advisingBank: "TradeFlow Bank",
        currency: f.currency, amount, utilized: 0,
        expiryDate: f.expiryDate, shipmentDate: f.shipmentDate, adviceDate: new Date().toISOString().slice(0, 10),
        goods: f.goods, status: "Approved", lienAmount: amount,
        documents: [], discrepancies: [], swiftMessages: [], audit: [], transfers: [], finance: [], realization: [],
      };
      await createRecord("export_lcs", rec, exportLCs);
      navigate({ to: "/export-lc" });
    } catch (e) { alert((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/export-lc" className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Advise New Export LC</h1>
          <p className="text-xs text-muted-foreground">From incoming SWIFT MT710 / MT711 or manual entry</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 space-y-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="rounded-md bg-status-issued/10 border border-status-issued/20 px-4 py-3 text-sm flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-status-issued mt-0.5" />
          <div>
            <span className="font-medium">SWIFT auto-parse:</span> Paste an MT710 message or upload to auto-fill fields. Manual entry required if parsing fails.
          </div>
        </div>

        <textarea
          placeholder=":27: 1/1&#10;:40A: IRREVOCABLE&#10;:20: ...&#10;Paste MT710 / MT711 message here…"
          className="w-full h-32 rounded-md border bg-muted/30 font-mono text-xs p-3 focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="grid grid-cols-2 gap-4">
          <Field label="LC Reference" placeholder="ELC-2026-00075" value={f.reference} onChange={set("reference")} />
          <Field label="Issuing Bank" placeholder="Nordea Bank, Stockholm" value={f.issuingBank} onChange={set("issuingBank")} />
          <Field label="Applicant" placeholder="H&M International" value={f.applicant} onChange={set("applicant")} />
          <Field label="Beneficiary" placeholder="Bay Garments Ltd." value={f.beneficiary} onChange={set("beneficiary")} />
          <Field label="Currency" placeholder="EUR" value={f.currency} onChange={set("currency")} />
          <Field label="Amount" placeholder="680,000" value={f.amount} onChange={set("amount")} />
          <Field label="Shipment Date" type="date" value={f.shipmentDate} onChange={set("shipmentDate")} />
          <Field label="Expiry Date" type="date" value={f.expiryDate} onChange={set("expiryDate")} />
          <Field label="Goods" placeholder="Knitwear, 40,000 pcs" full value={f.goods} onChange={set("goods")} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <button onClick={save} disabled={busy} className="px-4 py-2 rounded-md border text-sm hover:bg-muted disabled:opacity-50">Save Draft</button>
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">
            <Send className="h-4 w-4" /> Advise to Beneficiary
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text", full, value, onChange }: { label: string; placeholder?: string; type?: string; full?: boolean; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}