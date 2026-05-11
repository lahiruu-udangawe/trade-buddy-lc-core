import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle, XCircle, Sparkles, Trash2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractAndVerifyDocument, type ExtractResult } from "@/lib/lc-documents.functions";

const DOC_TYPES = [
  "Proforma Invoice",
  "Commercial Invoice",
  "Bill of Lading",
  "Packing List",
  "Insurance Certificate",
  "Certificate of Origin",
  "Inspection Certificate",
  "Other",
];

export type LCContext = {
  reference?: string;
  applicant?: string;
  beneficiary?: string;
  currency?: string;
  amount?: number;
  incoterm?: string;
  goods?: string;
  shipmentDate?: string;
  expiryDate?: string;
};

export type UploadedDoc = {
  id: string;
  name: string;
  size: number;
  type: string;
  docType: string;
  storagePath: string;
  publicUrl?: string;
  extraction?: ExtractResult;
  status: "uploading" | "analyzing" | "ready" | "error";
  error?: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      resolve(s.includes(",") ? s.split(",")[1] : s);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function LCDocumentUpload({ lcContext, onChange }: { lcContext: LCContext; onChange?: (docs: UploadedDoc[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("Proforma Invoice");
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const extractFn = useServerFn(extractAndVerifyDocument);

  function update(id: string, patch: Partial<UploadedDoc>) {
    setDocs((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...patch } : d));
      onChange?.(next);
      return next;
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Please sign in to upload documents."); return; }

    for (const file of Array.from(files)) {
      if (file.size > 15 * 1024 * 1024) { alert(`${file.name} exceeds 15MB.`); continue; }
      const id = crypto.randomUUID();
      const path = `${user.id}/${id}-${file.name}`;
      const entry: UploadedDoc = {
        id, name: file.name, size: file.size, type: file.type || "application/octet-stream",
        docType, storagePath: path, status: "uploading",
      };
      setDocs((p) => { const n = [...p, entry]; onChange?.(n); return n; });

      try {
        const { error: upErr } = await supabase.storage.from("lc-documents").upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("lc-documents").createSignedUrl(path, 60 * 60 * 24);
        update(id, { status: "analyzing", publicUrl: signed?.signedUrl });

        const base64 = await fileToBase64(file);
        const result = await extractFn({
          data: {
            fileBase64: base64, mimeType: file.type || "application/pdf", fileName: file.name,
            docType, lcContext,
          },
        });
        update(id, { status: "ready", extraction: result });
      } catch (e) {
        update(id, { status: "error", error: (e as Error).message });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-status-issued/10 border border-status-issued/20 px-4 py-3 text-sm flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-status-issued mt-0.5 shrink-0" />
        <div>
          <span className="font-medium">AI-powered OCR + UCP 600 verification.</span> Upload PI, invoice, BL, packing list or certificates — fields are extracted and cross-checked against this LC instantly.
        </div>
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Document type</label>
          <select value={docType} onChange={(e) => setDocType(e.target.value)} className="mt-1 w-full h-9 px-2 rounded-md border bg-background text-sm">
            {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed rounded-md h-20 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          <span>Click or drop PDF / image (max 15MB)</span>
          <input ref={inputRef} type="file" multiple accept="application/pdf,image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
        </div>
      </div>

      <div className="space-y-3">
        {docs.length === 0 && (
          <div className="text-xs text-muted-foreground italic">No documents uploaded yet.</div>
        )}
        {docs.map((d) => <DocCard key={d.id} doc={d} onRemove={async () => {
          await supabase.storage.from("lc-documents").remove([d.storagePath]).catch(() => {});
          setDocs((p) => { const n = p.filter((x) => x.id !== d.id); onChange?.(n); return n; });
        }} />)}
      </div>
    </div>
  );
}

function DocCard({ doc, onRemove }: { doc: UploadedDoc; onRemove: () => void }) {
  const ex = doc.extraction;
  const riskColor = ex?.riskLevel === "high" ? "text-status-rejected" : ex?.riskLevel === "medium" ? "text-status-issued" : "text-status-approved";
  return (
    <div className="rounded-lg border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between gap-3 p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{doc.name}</div>
            <div className="text-xs text-muted-foreground">{doc.docType} · {(doc.size / 1024).toFixed(0)} KB</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {doc.status === "uploading" && <Badge icon={<Loader2 className="h-3 w-3 animate-spin" />} text="Uploading…" />}
          {doc.status === "analyzing" && <Badge icon={<Loader2 className="h-3 w-3 animate-spin" />} text="AI analyzing…" />}
          {doc.status === "error" && <Badge icon={<XCircle className="h-3 w-3" />} text="Error" tone="danger" />}
          {doc.status === "ready" && ex && (
            <Badge icon={<ShieldCheck className={`h-3 w-3 ${riskColor}`} />} text={`${ex.riskLevel.toUpperCase()} risk · ${ex.ocrConfidence}% OCR`} />
          )}
          <button onClick={onRemove} className="p-1.5 rounded hover:bg-muted" title="Remove">
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {doc.status === "error" && (
        <div className="p-3 text-sm text-status-rejected">{doc.error}</div>
      )}

      {doc.status === "ready" && ex && (
        <div className="p-4 space-y-4">
          <div className="text-sm">
            <div className="font-medium">{ex.documentType}</div>
            <p className="text-muted-foreground mt-1">{ex.summary}</p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Extracted fields</div>
            <div className="grid grid-cols-2 gap-2">
              {ex.fields.map((f, i) => (
                <div key={i} className="rounded border p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{f.label}</span>
                    <span className="text-[10px] text-muted-foreground">{f.confidence}%</span>
                  </div>
                  <div className="text-sm font-medium mt-0.5 break-words">{f.value || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Verification vs LC</div>
            <div className="space-y-1.5">
              {ex.verifications.map((v, i) => {
                const Icon = v.status === "match" ? CheckCircle2 : v.status === "mismatch" ? XCircle : AlertTriangle;
                const tone = v.status === "match" ? "text-status-approved" : v.status === "mismatch" ? "text-status-rejected" : "text-status-issued";
                return (
                  <div key={i} className="flex items-start gap-2 text-sm rounded border p-2">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${tone}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{v.field} <span className="text-xs text-muted-foreground font-normal capitalize">· {v.status}</span></div>
                      <div className="text-xs text-muted-foreground mt-0.5">{v.note}</div>
                      {(v.expected || v.found) && (
                        <div className="text-xs mt-1 grid grid-cols-2 gap-2">
                          <div><span className="text-muted-foreground">LC: </span>{v.expected || "—"}</div>
                          <div><span className="text-muted-foreground">Doc: </span>{v.found || "—"}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ icon, text, tone }: { icon: React.ReactNode; text: string; tone?: "danger" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${tone === "danger" ? "border-status-rejected/30 text-status-rejected bg-status-rejected/10" : "bg-muted"}`}>
      {icon}{text}
    </span>
  );
}