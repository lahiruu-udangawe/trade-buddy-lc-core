import type { Party, LCDocument, ComplianceCheck, SwiftMessage, AuditEntry, ApprovalStep } from "./lc-types";

export type ExportWoLCStatus =
  | "Draft"
  | "Lodged"
  | "Dispatched"
  | "Accepted"
  | "Realized"
  | "Overdue"
  | "Closed";

export type ExportWoLCMode =
  | "Documentary Collection - DP"
  | "Documentary Collection - DA"
  | "Advance Receipt / TT"
  | "Open Account"
  | "Consignment";

export interface ExportWoLC {
  id: string;
  reference: string;
  mode: ExportWoLCMode;
  exporter: Party;
  buyer: Party;
  remittingBank?: string;
  collectingBank?: string;
  currency: string;
  invoiceAmount: number;
  realizedAmount: number;
  invoiceDate: string;
  invoiceNumber: string;
  blDate?: string;
  blNumber?: string;
  dueDate?: string;
  tenorDays?: number;
  goods: string;
  hsCode: string;
  incoterm: string;
  countryOfDestination: string;
  portOfLoading: string;
  portOfDischarge: string;
  status: ExportWoLCStatus;
  documents: LCDocument[];
  compliance: ComplianceCheck[];
  swiftMessages: SwiftMessage[];
  approvals: ApprovalStep[];
  audit: AuditEntry[];
  exp: { reference: string; amount: number; status: "Pending" | "Filed" | "Reported"; createdAt: string };
  finance?: { product: "PC" | "FDBP" | "LDBP"; amount: number; outstanding: number; status: string };
  realization?: { receivedAt: string; amount: number; channel: "MT103" | "MT202" | "MT940"; status: "Partial" | "Full" }[];
  charges: { label: string; amount: number }[];
  forexDeal?: { rate: number; dealId: string; bookedAt: string };
}