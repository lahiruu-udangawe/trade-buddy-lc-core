import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, Send, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/import-lc/new")({
  head: () => ({
    meta: [
      { title: "New Import LC — TradeFlow AI" },
      { name: "description", content: "Create a new import Letter of Credit application." },
    ],
  }),
  component: NewImportLC,
});

function NewImportLC() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const steps = ["Applicant & Limits", "Beneficiary & Bank", "Terms & Clauses", "Charges & Margin", "Review"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/import-lc" className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">New Import LC Application</h1>
          <p className="text-xs text-muted-foreground">Configurable form · Maker-Checker workflow</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {steps.map((s, i) => {
            const idx = i + 1;
            const active = idx === step;
            const done = idx < step;
            return (
              <button key={s} onClick={() => setStep(idx)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${active ? "bg-primary text-primary-foreground" : done ? "bg-status-approved/10 text-status-approved" : "bg-muted text-muted-foreground"}`}>
                <span className="h-5 w-5 rounded-full bg-card/30 flex items-center justify-center text-[10px]">{idx}</span>
                {s}
              </button>
            );
          })}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-md bg-status-issued/10 border border-status-issued/20 px-4 py-3 text-sm flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-status-issued mt-0.5 shrink-0" />
              <div><span className="font-medium">CBS auto-fetch enabled.</span> Customer details, account balances and limits are pulled from Core Banking.</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Customer ID" placeholder="CIF000284" />
              <Field label="Customer Name" placeholder="Apex Industries Ltd." />
              <Field label="Account Number" placeholder="0123-4567-8901" />
              <Field label="Available Limit" placeholder="USD 1,250,000" disabled />
              <Field label="LC Product" placeholder="Sight LC — Commercial" />
              <Field label="Reference Template" placeholder="Standard Capital Goods" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Beneficiary Name" placeholder="Shanghai Machinery Co." />
            <Field label="Beneficiary Country" placeholder="China" />
            <Field label="Beneficiary Address" placeholder="88 Pudong Ave, Shanghai" full />
            <Field label="Advising Bank" placeholder="Bank of China" />
            <Field label="Advising Bank SWIFT" placeholder="BKCHCNBJ" />
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Currency" placeholder="USD" />
            <Field label="Amount" placeholder="485,000" />
            <Field label="Tolerance %" placeholder="5" />
            <Field label="Incoterm" placeholder="CIF Chittagong" />
            <Field label="Shipment Date" type="date" />
            <Field label="Expiry Date" type="date" />
            <Field label="Goods Description" placeholder="CNC milling machines, model VMX-840" full />
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Clauses (from library)</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {["No partial shipment", "Transhipment allowed", "Insurance 110% CIF", "Latest BL date", "Inspection certificate required"].map((c) => (
                  <label key={c} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer hover:bg-muted">
                    <input type="checkbox" className="h-3.5 w-3.5" /> {c}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Margin %" placeholder="15" />
              <Field label="Margin Amount (auto)" placeholder="USD 72,750" disabled />
            </div>
            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              <div className="font-medium mb-2">Charge breakdown (auto-calculated)</div>
              <div className="space-y-1.5 text-sm">
                <Row k="Issuance commission (0.25%)" v="USD 1,212.50" />
                <Row k="SWIFT charges" v="USD 35.00" />
                <Row k="Handling fee" v="USD 150.00" />
                <div className="border-t pt-1.5 mt-1.5 font-semibold">
                  <Row k="Total charges" v="USD 1,397.50" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <div className="rounded-md bg-status-approved/10 border border-status-approved/20 p-4 text-sm">
              <div className="font-medium text-status-approved">Ready for submission</div>
              <p className="text-muted-foreground mt-1">All mandatory fields are valid. The LC will be routed for Maker → Checker → Trade Head approval.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Summary k="Applicant" v="Apex Industries Ltd." />
              <Summary k="Beneficiary" v="Shanghai Machinery Co." />
              <Summary k="Amount" v="USD 485,000" />
              <Summary k="Expiry" v="2026-07-15" />
              <Summary k="Margin" v="15% · USD 72,750" />
              <Summary k="Charges" v="USD 1,397.50" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 mt-6 border-t">
          <button onClick={() => setStep(Math.max(1, step - 1))} className="px-4 py-2 rounded-md border text-sm hover:bg-muted disabled:opacity-50" disabled={step === 1}>
            Back
          </button>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border text-sm hover:bg-muted">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            {step < 5 ? (
              <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">
                Continue
              </button>
            ) : (
              <button onClick={() => navigate({ to: "/import-lc" })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">
                <Send className="h-4 w-4" /> Submit for Approval
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text", disabled, full }: { label: string; placeholder?: string; type?: string; disabled?: boolean; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground"
      />
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
}
function Summary({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-medium mt-0.5">{v}</div>
    </div>
  );
}