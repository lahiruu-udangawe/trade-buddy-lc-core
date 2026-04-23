export type LCStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Issued"
  | "Utilized"
  | "Closed";

export type AmendmentStatus = "Pending" | "Approved" | "Rejected";

export interface Party {
  name: string;
  address: string;
  country: string;
  bank?: string;
}

export interface Charge {
  label: string;
  amount: number;
}

export interface Clause {
  id: string;
  title: string;
  body: string;
  category: "Standard" | "Custom" | "Special";
}

export interface LCDocument {
  id: string;
  name: string;
  type: "PI" | "Invoice" | "BL" | "Insurance" | "Packing List" | "Certificate" | "Other";
  uploadedAt: string;
  uploadedBy: string;
  version: number;
  size: string;
  ocrConfidence?: number;
}

export interface Discrepancy {
  id: string;
  type: "Late Shipment" | "Late Presentation" | "LC Expiry" | "Overdrawn LC" | "Field Mismatch";
  severity: "Low" | "Medium" | "High";
  detectedBy: "AI" | "Officer";
  remarks: string;
  status: "Open" | "Confirmed" | "Overridden";
}

export interface ComplianceCheck {
  id: string;
  party: string;
  type: "Sanctions" | "AML" | "Dual-Use Goods";
  result: "Clear" | "Flagged" | "Pending";
  checkedAt: string;
}

export interface SwiftMessage {
  id: string;
  type: "MT700" | "MT707" | "MT710" | "MT711" | "MT740" | "MT202" | "pacs.009";
  status: "Queued" | "Sent" | "ACK" | "NAK";
  createdAt: string;
  reference: string;
}

export interface Amendment {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  status: AmendmentStatus;
  requestedAt: string;
  approver?: string;
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface ApprovalStep {
  level: number;
  role: string;
  user?: string;
  status: "Pending" | "Approved" | "Rejected";
  comment?: string;
  actedAt?: string;
}

export interface ImportLC {
  id: string;
  reference: string;
  applicant: Party;
  beneficiary: Party;
  issuingBank: string;
  advisingBank: string;
  currency: string;
  amount: number;
  utilized: number;
  tolerance: number;
  expiryDate: string;
  shipmentDate: string;
  issueDate: string;
  goods: string;
  incoterm: string;
  paymentTerms: string;
  status: LCStatus;
  marginPercent: number;
  marginAmount: number;
  charges: Charge[];
  clauses: Clause[];
  documents: LCDocument[];
  discrepancies: Discrepancy[];
  compliance: ComplianceCheck[];
  swiftMessages: SwiftMessage[];
  amendments: Amendment[];
  approvals: ApprovalStep[];
  audit: AuditEntry[];
  shippingGuarantees: { id: string; reference: string; amount: number; expiry: string; status: string }[];
  imp?: { reference: string; amount: number; status: string; createdAt: string };
}

export interface ExportLC {
  id: string;
  reference: string;
  beneficiary: Party;
  applicant: Party;
  issuingBank: string;
  advisingBank: string;
  currency: string;
  amount: number;
  utilized: number;
  expiryDate: string;
  shipmentDate: string;
  adviceDate: string;
  goods: string;
  status: LCStatus;
  lienAmount: number;
  documents: LCDocument[];
  discrepancies: Discrepancy[];
  swiftMessages: SwiftMessage[];
  audit: AuditEntry[];
  transfers: { id: string; transferee: string; amount: number; type: "Full" | "Partial"; date: string }[];
  backToBack?: { reference: string; amount: number; status: string };
  finance: { id: string; product: "PC" | "FDBP" | "LDBP" | "SOD" | "MDB" | "STL" | "Bai-Salam"; amount: number; status: string; outstanding: number }[];
  forwarding?: { bank: string; courier: string; awb: string; dispatchedAt: string };
  realization: { receivedAt: string; amount: number; status: "Partial" | "Full" }[];
  isFOC?: boolean;
}