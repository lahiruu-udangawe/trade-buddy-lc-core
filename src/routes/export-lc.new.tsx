import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { createRecord, logSwiftMessage } from "@/lib/data-store";
import { exportLCs } from "@/lib/mock-lc-data";
import type { ExportLC } from "@/lib/lc-types";
import { LCDocumentUpload, type UploadedDoc } from "@/components/lc/LCDocumentUpload";

export const Route = createFileRoute("/export-lc/new")({
  head: () => ({
    meta: [
      { title: "Advise Export LC — TradeFlow AI" },
      { name: "description", content: "Capture incoming LC advice (MT700/MT710), upload documents and run AI scrutiny." },
    ],
  }),
  component: NewExportLC,
});

function NewExportLC() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [swiftRaw, setSwiftRaw] = useState("");
  const [f, setF] = useState({
    reference: "", issuingBank: "", issuingBankSwift: "", applicant: "", applicantCountry: "",
    beneficiary: "", beneficiaryCountry: "Bangladesh",
    currency: "USD", amount: "", tolerance: "5", incoterm: "",
    shipmentDate: "", expiryDate: "", goods: "", confirmationRequest: "without",
    financeProduct: "None",
  });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  function parseSwift() {
    if (!swiftRaw.trim()) return;
    const get = (tag: string) => {
      const m = swiftRaw.match(new RegExp(`:${tag}:\\s*([^\\n:]+(?:\\n(?!:[0-9]{2}[A-Z]?:)[^\\n]+)*)`, "i"));
      return m ? m[1].trim().replace(/\s+/g, " ") : "";
    };
    const ref = get("20");
    const ccyAmt = get("32B");
    const ccy = ccyAmt.slice(0, 3);
    const amt = ccyAmt.slice(3).replace(/[^\d.,]/g, "").replace(/,/g, "");
    setF((s) => ({
      ...s,
      reference: ref || s.reference,
      currency: ccy || s.currency,
      amount: amt || s.amount,
      issuingBank: get("52A") || s.issuingBank,
      applicant: get("50") || s.applicant,
      beneficiary: get("59") || s.beneficiary,
      expiryDate: get("31D") || s.expiryDate,
      shipmentDate: get("44C") || s.shipmentDate,
      goods: get("45A") || s.goods,
      incoterm: get("46A").slice(0, 80) || s.incoterm,
    }));
  }

  async function submit(asDraft = false) {
    setBusy(true);
    try {
      const amount = Number(f.amount.replace(/[^\d.]/g, "")) || 0;
      const ref = f.reference || `ELC-${new Date().getFullYear()}-${String(exportLCs.length + 1).padStart(5, "0")}`;
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
      const rec: ExportLC = {
        id: crypto.randomUUID(), reference: ref,
        beneficiary: { name: f.beneficiary || "—", address: "", country: f.beneficiaryCountry },
        applicant: { name: f.applicant || "—", address: "", country: f.applicantCountry },
        issuingBank: f.issuingBank, advisingBank: "TradeFlow Bank",
        currency: f.currency, amount, utilized: 0,
        expiryDate: f.expiryDate, shipmentDate: f.shipmentDate,
        adviceDate: new Date().toISOString().slice(0, 10),
        goods: f.goods, status: asDraft ? "Draft" : "Approved", lienAmount: amount,
        documents: docs as never, discrepancies: aiDiscrepancies, swiftMessages: [], audit: [
          { id: crypto.randomUUID(), user: "You", action: asDraft ? "Saved draft" : "Advised to beneficiary", timestamp: new Date().toISOString() },
        ], transfers: [],
        finance: f.financeProduct !== "None" ? [{ id: crypto.randomUUID(), product: f.financeProduct as never, amount: amount * 0.8, status: "Requested", outstanding: amount * 0.8 }] : [],
        realization: [],
      };
      await createRecord("export_lcs", rec, exportLCs);
      if (!asDraft) {
        await logSwiftMessage({
          module: "export-lc", parentReference: ref, type: "MT730",
          direction: "OUT", status: "Sent", reference: `${ref}-ACK`,
          payload: { note: "Acknowledgement of LC receipt", issuingBank: f.issuingBank },
        }).catch(() => {});
      }
      navigate({ to: "/export-lc" });
    } catch (e) { alert("Failed to save: " + (e as Error).message); } finally { setBusy(false); }
  }

  const steps = ["Inbound SWIFT", "Issuing Bank & Applicant", "LC Terms", "Documents & AI", "Finance & Review"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/export-lc" className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Advise New Export LC</h1>
          <p className="text-xs text-muted-foreground">Inbound SWIFT MT700/MT710 → advise → document scrutiny → financing</p>
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
              <div>
                <span className="font-medium">SWIFT auto-parse:</span> Paste an MT700 / MT710 message and we extract :20:, :32B:, :50:, :59:, :31D:, :44C:, :45A:, :46A:.
              </div>
            </div>
            <textarea
              value={swiftRaw}
              onChange={(e) => setSwiftRaw(e.target.value)}
              placeholder=":27:1/1\n:40A:IRREVOCABLE\n:20:ELC-REF-12345\n:31C:260512\n:32B:USD680000,00\n:50:H&M International\n:59:Bay Garments Ltd.\n:31D:260815 BD\n:44C:260720\n:45A:KNITWEAR, 40,000 PCS\n:46A:CIF CHITTAGONG"
              className="w-full h-48 rounded-md border bg-muted/30 font-mono text-xs p-3 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex justify-end">
              <button onClick={parseSwift} className="px-3 py-1.5 rounded-md border text-sm hover:bg-muted">Parse SWIFT</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="LC Reference" placeholder="ELC-2026-00075" value={f.reference} onChange={set("reference")} />
            <Field label="Issuing Bank" placeholder="Nordea Bank, Stockholm" value={f.issuingBank} onChange={set("issuingBank")} />
            <Field label="Issuing Bank SWIFT" placeholder="NDEASESS" value={f.issuingBankSwift} onChange={set("issuingBankSwift")} />
            <Field label="Confirmation" placeholder="without / with / may add" value={f.confirmationRequest} onChange={set("confirmationRequest")} />
            <Field label="Applicant Name" placeholder="H&M International" value={f.applicant} onChange={set("applicant")} />
            <Field label="Applicant Country" placeholder="Sweden" value={f.applicantCountry} onChange={set("applicantCountry")} />
            <Field label="Beneficiary Name" placeholder="Bay Garments Ltd." value={f.beneficiary} onChange={set("beneficiary")} />
            <Field label="Beneficiary Country" placeholder="Bangladesh" value={f.beneficiaryCountry} onChange={set("beneficiaryCountry")} />
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Currency" placeholder="USD" value={f.currency} onChange={set("currency")} />
            <Field label="Amount" placeholder="680,000" value={f.amount} onChange={set("amount")} />
            <Field label="Tolerance %" placeholder="5" value={f.tolerance} onChange={set("tolerance")} />
            <Field label="Incoterm" placeholder="CIF Chittagong" value={f.incoterm} onChange={set("incoterm")} />
            <Field label="Latest Shipment" type="date" value={f.shipmentDate} onChange={set("shipmentDate")} />
            <Field label="Expiry Date" type="date" value={f.expiryDate} onChange={set("expiryDate")} />
            <Field label="Goods Description" placeholder="Knitwear, 40,000 pcs" full value={f.goods} onChange={set("goods")} />
          </div>
        )}

        {step === 4 && (
          <LCDocumentUpload
            lcContext={{
              reference: f.reference, applicant: f.applicant, beneficiary: f.beneficiary,
              currency: f.currency, amount: Number(f.amount.replace(/[^\d.]/g, "")) || undefined,
              incoterm: f.incoterm, goods: f.goods,
              shipmentDate: f.shipmentDate, expiryDate: f.expiryDate,
            }}
            onChange={setUploadedDocs}
          />
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pre-shipment / post-shipment finance</label>
              <select value={f.financeProduct} onChange={(e) => set("financeProduct")(e.target.value)} className="mt-1 w-full h-9 px-2 rounded-md border bg-background text-sm">
                {["None", "PC", "FDBP", "LDBP", "SOD", "MDB", "STL", "Bai-Salam"].map((p) => <option key={p}>{p}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Selecting a product creates a finance request at 80% of LC value.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Summary k="Reference" v={f.reference || "(auto)"} />
              <Summary k="Issuing Bank" v={f.issuingBank || "—"} />
              <Summary k="Applicant" v={f.applicant || "—"} />
              <Summary k="Beneficiary" v={f.beneficiary || "—"} />
              <Summary k="Amount" v={`${f.currency} ${f.amount || "0"}`} />
              <Summary k="Expiry" v={f.expiryDate || "—"} />
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
            <button onClick={() => submit(true)} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border text-sm hover:bg-muted disabled:opacity-50">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            {step < 5 ? (
              <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">
                Continue
              </button>
            ) : (
              <button onClick={() => submit(false)} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">
                <Send className="h-4 w-4" /> Advise to Beneficiary
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text", full, value, onChange }: { label: string; placeholder?: string; type?: string; full?: boolean; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input type={type} placeholder={placeholder} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}
function Summary({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-medium mt-0.5 break-words">{v}</div>
    </div>
  );
}