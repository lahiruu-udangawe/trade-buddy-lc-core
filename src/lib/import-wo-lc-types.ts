import type { Party, LCDocument, ComplianceCheck, SwiftMessage, AuditEntry, ApprovalStep } from "./lc-types";

export type ImportWoLCStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Lodged"
  | "Accepted"
  | "Paid"
  | "Closed"
  | "Overdue";

export type ImportWoLCMode =
  | "Documentary Collection - DP"
  | "Documentary Collection - DA"
  | "Advance Payment / TT"
  | "Open Account"
  | "Consignment";

export interface ImportWoLC {
  id: string;
  reference: string;
  mode: ImportWoLCMode;
  applicant: Party;
  supplier: Party;
  remittingBank?: string;
  collectingBank?: string;
  currency: string;
  invoiceAmount: number;
  paidAmount: number;
  invoiceDate: string;
  invoiceNumber: string;
  blDate?: string;
  blNumber?: string;
  dueDate?: string;
  tenorDays?: number;
  goods: string;
  hsCode: string;
  incoterm: string;
  countryOfOrigin: string;
  portOfLoading: string;
  portOfDischarge: string;
  status: ImportWoLCStatus;
  documents: LCDocument[];
  discrepancies: { id: string; type: string; severity: "Low" | "Medium" | "High"; remarks: string; status: "Open" | "Resolved" }[];
  compliance: ComplianceCheck[];
  swiftMessages: SwiftMessage[];
  approvals: ApprovalStep[];
  audit: AuditEntry[];
  imp: { reference: string; amount: number; status: "Pending" | "Filed" | "Reported"; createdAt: string };
  remittance?: { utr: string; channel: "MT103" | "MT202" | "Nostro"; amount: number; sentAt: string; status: "Queued" | "Sent" | "Settled" };
  charges: { label: string; amount: number }[];
  forexDeal?: { rate: number; dealId: string; bookedAt: string };
}