import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/guarantees/new")({
  head: () => ({
    meta: [
      { title: "New Guarantee — TradeFlow AI" },
      { name: "description", content: "Issue a new bank guarantee or standby LC." },
    ],
  }),
  component: NewGuarantee,
});

const types = [
  "Bid Bond", "Performance Guarantee", "Advance Payment Guarantee",
  "Financial Guarantee", "Shipping Guarantee", "Standby LC",
  "Customs Guarantee", "Retention Guarantee",
];

function NewGuarantee() {
  const navigate = useNavigate();
  const [type, setType] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/guarantees" className="p-2 rounded-md hover:bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> New Guarantee</h1>
          <p className="text-sm text-muted-foreground">Pick a guarantee type to begin issuance.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {types.map((t) => (
          <button key={t} onClick={() => setType(t)} className={`text-left bg-card border rounded-xl p-4 hover:border-primary transition-colors ${type === t ? "border-primary ring-2 ring-primary/20" : ""}`} style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="font-medium text-sm">{t}</div>
          </button>
        ))}
      </div>

      {type && (
        <div className="bg-card border rounded-xl p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-semibold text-sm">Issuance details — {type}</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field label="Applicant" placeholder="Customer name" />
            <Field label="Beneficiary" placeholder="Beneficiary name" />
            <Field label="Currency" placeholder="USD / BDT" />
            <Field label="Amount" placeholder="0.00" />
            <Field label="Margin %" placeholder="10" />
            <Field label="Underlying contract" placeholder="Tender / contract ref" />
            <Field label="Issue date" type="date" />
            <Field label="Expiry date" type="date" />
            <Field label="Claim expiry" type="date" />
            <Field label="Counter-guarantee bank" placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setType(null)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
            <button onClick={() => navigate({ to: "/guarantees" })} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">Save Draft</button>
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