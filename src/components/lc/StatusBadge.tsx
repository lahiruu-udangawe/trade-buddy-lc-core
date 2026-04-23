import { cn } from "@/lib/utils";
import type { LCStatus } from "@/lib/lc-types";

const map: Record<LCStatus | string, { bg: string; text: string; dot: string }> = {
  Draft: { bg: "bg-muted", text: "text-status-draft", dot: "bg-status-draft" },
  Submitted: { bg: "bg-status-submitted/10", text: "text-status-submitted", dot: "bg-status-submitted" },
  Approved: { bg: "bg-status-approved/10", text: "text-status-approved", dot: "bg-status-approved" },
  Issued: { bg: "bg-status-issued/10", text: "text-status-issued", dot: "bg-status-issued" },
  Utilized: { bg: "bg-status-utilized/10", text: "text-status-utilized", dot: "bg-status-utilized" },
  Closed: { bg: "bg-status-closed/10", text: "text-status-closed", dot: "bg-status-closed" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = map[status] ?? map.Draft;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", s.bg, s.text, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {status}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: "Low" | "Medium" | "High" }) {
  const map = {
    Low: "bg-status-approved/10 text-status-approved",
    Medium: "bg-status-warning/10 text-status-warning",
    High: "bg-status-error/10 text-status-error",
  };
  return <span className={cn("rounded px-2 py-0.5 text-xs font-medium", map[severity])}>{severity}</span>;
}

export function ResultBadge({ result }: { result: string }) {
  const styles =
    result === "Clear" || result === "ACK" || result === "Approved"
      ? "bg-status-approved/10 text-status-approved"
      : result === "Flagged" || result === "NAK" || result === "Rejected" || result === "Open"
        ? "bg-status-error/10 text-status-error"
        : "bg-status-warning/10 text-status-warning";
  return <span className={cn("rounded px-2 py-0.5 text-xs font-medium", styles)}>{result}</span>;
}