import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ExtractInput = {
  fileBase64: string;
  mimeType: string;
  fileName: string;
  docType: string;
  lcContext?: {
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
};

export type ExtractedField = { label: string; value: string; confidence: number };
export type VerificationCheck = {
  field: string;
  status: "match" | "mismatch" | "missing" | "warning";
  expected?: string;
  found?: string;
  note: string;
};
export type ExtractResult = {
  documentType: string;
  summary: string;
  fields: ExtractedField[];
  verifications: VerificationCheck[];
  riskLevel: "low" | "medium" | "high";
  ocrConfidence: number;
};

export const extractAndVerifyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ExtractInput) => input)
  .handler(async ({ data }): Promise<ExtractResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const ctx = data.lcContext ?? {};
    const systemPrompt = `You are a trade-finance document analyst for a bank. You receive a scanned trade document (proforma invoice, commercial invoice, bill of lading, packing list, insurance certificate, certificate of origin, etc.) and you must:
1. Identify the document type.
2. Extract all key structured fields with OCR.
3. Cross-verify the extracted fields against the issuing Letter of Credit context provided.
4. Flag UCP 600 / ISBP discrepancies (party name mismatch, amount overdrawn, late shipment, currency mismatch, incoterm mismatch, vague goods description, missing endorsements, etc.).
5. Assign an overall risk level.

Return ONLY a JSON object via the provided tool. Be precise. Confidence is 0-100.`;

    const userPrompt = `Document type expected by user: ${data.docType}
File name: ${data.fileName}

LC Context:
- Reference: ${ctx.reference ?? "n/a"}
- Applicant: ${ctx.applicant ?? "n/a"}
- Beneficiary: ${ctx.beneficiary ?? "n/a"}
- Currency / Amount: ${ctx.currency ?? "n/a"} ${ctx.amount ?? "n/a"}
- Incoterm: ${ctx.incoterm ?? "n/a"}
- Goods: ${ctx.goods ?? "n/a"}
- Latest Shipment: ${ctx.shipmentDate ?? "n/a"}
- Expiry: ${ctx.expiryDate ?? "n/a"}

Analyze the attached document and return the structured result.`;

    const isImage = data.mimeType.startsWith("image/");
    const isPdf = data.mimeType === "application/pdf";
    const dataUrl = `data:${data.mimeType};base64,${data.fileBase64}`;

    const userContent: Array<Record<string, unknown>> = [{ type: "text", text: userPrompt }];
    if (isImage || isPdf) {
      userContent.push({ type: "image_url", image_url: { url: dataUrl } });
    } else {
      userContent.push({ type: "text", text: "(Non-visual file uploaded; rely on filename and LC context only.)" });
    }

    const tool = {
      type: "function",
      function: {
        name: "report_document",
        description: "Return OCR extraction and LC verification report.",
        parameters: {
          type: "object",
          properties: {
            documentType: { type: "string" },
            summary: { type: "string" },
            ocrConfidence: { type: "number" },
            riskLevel: { type: "string", enum: ["low", "medium", "high"] },
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  value: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["label", "value", "confidence"],
                additionalProperties: false,
              },
            },
            verifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  status: { type: "string", enum: ["match", "mismatch", "missing", "warning"] },
                  expected: { type: "string" },
                  found: { type: "string" },
                  note: { type: "string" },
                },
                required: ["field", "status", "note"],
                additionalProperties: false,
              },
            },
          },
          required: ["documentType", "summary", "ocrConfidence", "riskLevel", "fields", "verifications"],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "report_document" } },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      if (resp.status === 429) throw new Error("Rate limit reached. Please retry shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Top up in Workspace settings.");
      console.error("AI gateway error:", resp.status, text);
      throw new Error(`AI extraction failed (${resp.status})`);
    }

    const json = await resp.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("AI returned no structured result");
    const args = JSON.parse(call.function.arguments) as ExtractResult;
    return args;
  });