import type { Party, ComplianceCheck, SwiftMessage, AuditEntry, ApprovalStep, LCDocument } from "./lc-types";

export type GuaranteeStatus = "Draft" | "Issued" | "Amended" | "Invoked" | "Expired" | "Closed";
export type GuaranteeType =
  | "Bid Bond"
  | "Performance Guarantee"
  | "Advance Payment Guarantee"
  | "Financial Guarantee"
  | "Shipping Guarantee"
  | "Standby LC"
  | "Customs Guarantee"
  | "Retention Guarantee";

export interface Guarantee {
  id: string;
  reference: string;
  type: GuaranteeType;
  applicant: Party;
  beneficiary: Party;
  issuingBank: string;
  advisingBank?: string;
  currency: string;
  amount: number;
  marginPercent: number;
  marginAmount: number;
  issueDate: string;
  expiryDate: string;
  claimExpiryDate?: string;
  status: GuaranteeStatus;
  purpose: string;
  underlyingContract?: string;
  counterGuarantee?: { bank: string; reference: string };
  documents: LCDocument[];
  compliance: ComplianceCheck[];
  swiftMessages: SwiftMessage[];
  approvals: ApprovalStep[];
  audit: AuditEntry[];
  charges: { label: string; amount: number }[];
  amendments: { id: string; field: string; oldValue: string; newValue: string; status: "Pending" | "Approved" | "Rejected"; requestedAt: string }[];
  invocations?: { id: string; amount: number; receivedAt: string; status: "Under Review" | "Honored" | "Rejected"; remarks?: string }[];
}