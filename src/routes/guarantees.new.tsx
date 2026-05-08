import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { createRecord } from "@/lib/data-store";
import { guarantees } from "@/lib/mock-guarantees";
import type { Guarantee, GuaranteeType } from "@/lib/guarantee-types";

export const Route = createFileRoute("/guarantees/new")({
  head: () => ({
    meta: [
      { title: "New Guarantee — TradeFlow AI" },
      { name: "description", content: "Issue a new bank guarantee or standby LC." },
    ],
  }),
  component: NewGuarantee,
});

const types: GuaranteeType[] = [
  "Bid Bond", "Performance Guarantee", "Advance Payment Guarantee",
  "Financial Guarantee", "Shipping Guarantee", "Standby LC",
  "Customs Guarantee", "Retention Guarantee",
];

function NewGuarantee() {
  const navigate = useNavigate();
  const [type, setType] = useState<GuaranteeType | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ applicant: "", beneficiary: "", currency: "USD", amount: "", margin: "10", contract: "", issueDate: "", expiryDate: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function save() {
    if (!type) return;
    setBusy(true);
    try {
      const amount = Number(f.amount.replace(/[^\d.]/g, "")) || 0;
      const marginPct = Number(f.margin) || 0;
      const ref = `BG-${new Date().getFullYear()}-${String(guarantees.length + 1).padStart(5, "0")}`;
      const rec: Guarantee = {
        id: crypto.randomUUID(), reference: ref, type,
        applicant: { name: f.applicant, address: "", country: "Bangladesh" },
        beneficiary: { name: f.beneficiary, address: "", country: "" },
        issuingBank: "TradeFlow Bank",
        currency: f.currency, amount, marginPercent: marginPct, marginAmount: amount * marginPct / 100,
        issueDate: f.issueDate || new Date().toISOString().slice(0, 10),
        expiryDate: f.expiryDate, status: "Draft",
        purpose: f.contract, underlyingContract: f.contract,
        documents: [], compliance: [], swiftMessages: [], approvals: [], audit: [],
        charges: [], amendments: [],
      };
      await createRecord("guarantees", rec, guarantees);
      navigate({ to: "/guarantees" });
    } catch (e) { alert((e as Error).message); } finally { setBusy(false); }
  }

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
            <Field label="Applicant" placeholder="Customer name" value={f.applicant} onChange={set("applicant")} />
            <Field label="Beneficiary" placeholder="Beneficiary name" value={f.beneficiary} onChange={set("beneficiary")} />
            <Field label="Currency" placeholder="USD / BDT" value={f.currency} onChange={set("currency")} />
            <Field label="Amount" placeholder="0.00" value={f.amount} onChange={set("amount")} />
            <Field label="Margin %" placeholder="10" value={f.margin} onChange={set("margin")} />
            <Field label="Underlying contract" placeholder="Tender / contract ref" value={f.contract} onChange={set("contract")} />
            <Field label="Issue date" type="date" value={f.issueDate} onChange={set("issueDate")} />
            <Field label="Expiry date" type="date" value={f.expiryDate} onChange={set("expiryDate")} />
            <Field label="Claim expiry" type="date" />
            <Field label="Counter-guarantee bank" placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setType(null)} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
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