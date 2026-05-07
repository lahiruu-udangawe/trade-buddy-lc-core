import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileOutput } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/export-wo-lc/new")({
  head: () => ({
    meta: [
      { title: "New Export w/o LC — TradeFlow AI" },
      { name: "description", content: "Initiate a new export without LC transaction." },
    ],
  }),
  component: NewExportWoLC,
});

const modes = [
  { id: "dp", label: "Documentary Collection — DP", desc: "Documents handed to collecting bank, released against payment." },
  { id: "da", label: "Documentary Collection — DA", desc: "Documents released against acceptance of usance bill of exchange." },
  { id: "tt", label: "Advance Receipt / TT", desc: "Inward remittance received before shipment." },
  { id: "oa", label: "Open Account", desc: "Goods shipped against agreed credit terms with buyer." },
  { id: "consign", label: "Consignment", desc: "Goods sent on consignment, realized on sale." },
];

function NewExportWoLC() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<string | null>(null);

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
            <Field label="Exporter" placeholder="Beneficiary / exporter name" />
            <Field label="Buyer" placeholder="Overseas buyer name" />
            <Field label="Invoice #" placeholder="EXP-XXXX" />
            <Field label="Invoice date" type="date" />
            <Field label="Currency" placeholder="USD" />
            <Field label="Invoice amount" placeholder="0.00" />
            <Field label="HS code" placeholder="0000.00" />
            <Field label="Incoterm" placeholder="FOB / CFR / CIF" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setMode(null)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
            <button onClick={() => navigate({ to: "/export-wo-lc" })} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">Save Draft</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input type={type} placeholder={placeholder} className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}