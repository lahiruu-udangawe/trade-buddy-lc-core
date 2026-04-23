import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LCStatus } from "@/lib/lc-types";

const stages: LCStatus[] = ["Draft", "Submitted", "Approved", "Issued", "Utilized", "Closed"];

export function LCStageStepper({ current }: { current: LCStatus }) {
  const idx = stages.indexOf(current);
  return (
    <div className="flex items-center w-full">
      {stages.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                  done && "bg-status-approved border-status-approved text-primary-foreground",
                  active && "bg-primary border-primary text-primary-foreground",
                  !done && !active && "bg-card border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn("text-[11px]", active ? "text-foreground font-medium" : "text-muted-foreground")}>{s}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-2", i < idx ? "bg-status-approved" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}