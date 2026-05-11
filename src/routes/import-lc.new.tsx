import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { createRecord } from "@/lib/data-store";
import { importLCs } from "@/lib/mock-lc-data";
import type { ImportLC } from "@/lib/lc-types";
import { LCDocumentUpload, type UploadedDoc } from "@/components/lc/LCDocumentUpload";

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
  const [busy, setBusy] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [form, setForm] = useState({
    customerName: "", beneficiaryName: "", beneficiaryCountry: "", beneficiaryAddress: "",
    advisingBank: "", currency: "USD", amount: "", tolerance: "5", incoterm: "",
    shipmentDate: "", expiryDate: "", goods: "", marginPercent: "15",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setBusy(true);
    try {
      const amount = Number(form.amount.replace(/[^\d.]/g, "")) || 0;
      const margin = (Number(form.marginPercent) || 0) * amount / 100;
      const ref = `ILC-${new Date().getFullYear()}-${String(importLCs.length + 1).padStart(5, "0")}`;
      const docs = uploadedDocs.map((d) => ({
        id: d.id, name: d.name, type: (d.docType as never) || "Other",
        uploadedAt: new Date().toISOString(), uploadedBy: "You", version: 1,
        size: `${(d.size / 1024).toFixed(0)} KB`,
        ocrConfidence: d.extraction?.ocrConfidence,
      }));
      const aiDiscrepancies = uploadedDocs.flatMap((d) =>
        (d.extraction?.verifications ?? [])
          .filter((v) => v.status === "mismatch" || v.status === "warning")
          .map((v) => ({
            id: crypto.randomUUID(),
            type: "Field Mismatch" as const,
            severity: (v.status === "mismatch" ? "High" : "Medium") as "High" | "Medium",
            detectedBy: "AI" as const,
            remarks: `${d.name} · ${v.field}: ${v.note}`,
            status: "Open" as const,
          }))
      );
      const record: ImportLC = {
        id: crypto.randomUUID(),
        reference: ref,
        applicant: { name: form.customerName || "—", address: "", country: "Bangladesh" },
        beneficiary: { name: form.beneficiaryName || "—", address: form.beneficiaryAddress, country: form.beneficiaryCountry, bank: form.advisingBank },
        issuingBank: "TradeFlow Bank",
        advisingBank: form.advisingBank,
        currency: form.currency,
        amount, utilized: 0, tolerance: Number(form.tolerance) || 0,
        expiryDate: form.expiryDate, shipmentDate: form.shipmentDate,
        issueDate: new Date().toISOString().slice(0, 10),
        goods: form.goods, incoterm: form.incoterm, paymentTerms: "Sight",
        status: "Submitted", marginPercent: Number(form.marginPercent) || 0, marginAmount: margin,
        charges: [], clauses: [], documents: docs as never, discrepancies: aiDiscrepancies, compliance: [],
        swiftMessages: [], amendments: [],
        approvals: [{ level: 1, role: "Maker", status: "Approved", actedAt: new Date().toISOString() }],
        audit: [{ id: crypto.randomUUID(), user: "You", action: "LC submitted for approval", timestamp: new Date().toISOString() }],
        shippingGuarantees: [],
      };
      await createRecord("import_lcs", record, importLCs);
      navigate({ to: "/import-lc" });
    } catch (e) {
      alert("Failed to save: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const steps = ["Applicant & Limits", "Beneficiary & Bank", "Terms & Clauses", "Charges & Margin", "Documents & AI", "Review"];

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
              <Field label="Customer Name" placeholder="Apex Industries Ltd." value={form.customerName} onChange={set("customerName")} />
              <Field label="Account Number" placeholder="0123-4567-8901" />
              <Field label="Available Limit" placeholder="USD 1,250,000" disabled />
              <Field label="LC Product" placeholder="Sight LC — Commercial" />
              <Field label="Reference Template" placeholder="Standard Capital Goods" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Beneficiary Name" placeholder="Shanghai Machinery Co." value={form.beneficiaryName} onChange={set("beneficiaryName")} />
            <Field label="Beneficiary Country" placeholder="China" value={form.beneficiaryCountry} onChange={set("beneficiaryCountry")} />
            <Field label="Beneficiary Address" placeholder="88 Pudong Ave, Shanghai" full value={form.beneficiaryAddress} onChange={set("beneficiaryAddress")} />
            <Field label="Advising Bank" placeholder="Bank of China" value={form.advisingBank} onChange={set("advisingBank")} />
            <Field label="Advising Bank SWIFT" placeholder="BKCHCNBJ" />
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Currency" placeholder="USD" value={form.currency} onChange={set("currency")} />
            <Field label="Amount" placeholder="485,000" value={form.amount} onChange={set("amount")} />
            <Field label="Tolerance %" placeholder="5" value={form.tolerance} onChange={set("tolerance")} />
            <Field label="Incoterm" placeholder="CIF Chittagong" value={form.incoterm} onChange={set("incoterm")} />
            <Field label="Shipment Date" type="date" value={form.shipmentDate} onChange={set("shipmentDate")} />
            <Field label="Expiry Date" type="date" value={form.expiryDate} onChange={set("expiryDate")} />
            <Field label="Goods Description" placeholder="CNC milling machines, model VMX-840" full value={form.goods} onChange={set("goods")} />
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
              <Field label="Margin %" placeholder="15" value={form.marginPercent} onChange={set("marginPercent")} />
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
          <LCDocumentUpload
            lcContext={{
              applicant: form.customerName,
              beneficiary: form.beneficiaryName,
              currency: form.currency,
              amount: Number(form.amount.replace(/[^\d.]/g, "")) || undefined,
              incoterm: form.incoterm,
              goods: form.goods,
              shipmentDate: form.shipmentDate,
              expiryDate: form.expiryDate,
            }}
            onChange={setUploadedDocs}
          />
        )}

        {step === 6 && (
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
            {uploadedDocs.length > 0 && (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium mb-1">{uploadedDocs.length} document(s) attached</div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {uploadedDocs.map((d) => (
                    <li key={d.id}>• {d.name} — {d.extraction ? `${d.extraction.riskLevel} risk, ${d.extraction.verifications.filter(v => v.status === "mismatch").length} mismatch(es)` : d.status}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-6 mt-6 border-t">
          <button onClick={() => setStep(Math.max(1, step - 1))} className="px-4 py-2 rounded-md border text-sm hover:bg-muted disabled:opacity-50" disabled={step === 1}>
            Back
          </button>
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border text-sm hover:bg-muted disabled:opacity-50">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            {step < 6 ? (
              <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">
                Continue
              </button>
            ) : (
              <button onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">
                <Send className="h-4 w-4" /> Submit for Approval
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text", disabled, full, value, onChange }: { label: string; placeholder?: string; type?: string; disabled?: boolean; full?: boolean; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
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