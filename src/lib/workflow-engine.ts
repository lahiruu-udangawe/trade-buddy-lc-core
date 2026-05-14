import { supabase } from "@/integrations/supabase/client";

export type WorkflowModule =
  | "Import LC"
  | "Export LC"
  | "Import w/o LC"
  | "Export w/o LC"
  | "Guarantee"
  | "Remittance";

export type TaskStatus =
  | "Pending"
  | "InProgress"
  | "Approved"
  | "Rejected"
  | "SentBack"
  | "Escalated"
  | "Completed";

export type TaskPriority = "Low" | "Normal" | "High" | "Urgent";

export interface WorkflowStep {
  stage: string;
  role: string;
  slaHours: number;
  description: string;
  escalateToRole?: string;
}

export interface WorkflowDefinition {
  key: string;
  module: WorkflowModule;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

// Predefined workflow definitions (configured at implementation time).
export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  {
    key: "import_lc_issue",
    module: "Import LC",
    name: "Import LC Issuance",
    description: "End-to-end maker-checker flow for issuing a new Import LC.",
    steps: [
      { stage: "Data Capture", role: "Maker", slaHours: 4, description: "Officer captures LC application data and supporting docs." },
      { stage: "Compliance Check", role: "Compliance", slaHours: 6, description: "Sanctions / AML / dual-use screening on all parties.", escalateToRole: "Compliance Head" },
      { stage: "Credit Review", role: "Credit Officer", slaHours: 8, description: "Verify customer limit utilisation and margin." },
      { stage: "Checker Approval", role: "Checker", slaHours: 4, description: "Second-eye verification of LC terms.", escalateToRole: "Branch Manager" },
      { stage: "Authorisation", role: "Authoriser", slaHours: 4, description: "Final authorisation before SWIFT release.", escalateToRole: "Trade Head" },
      { stage: "SWIFT Release", role: "SWIFT Operator", slaHours: 2, description: "Release MT700 to advising bank." },
    ],
  },
  {
    key: "import_lc_amend",
    module: "Import LC",
    name: "Import LC Amendment",
    description: "Amendment workflow with consent tracking.",
    steps: [
      { stage: "Amendment Capture", role: "Maker", slaHours: 4, description: "Capture amendment fields." },
      { stage: "Checker Approval", role: "Checker", slaHours: 4, description: "Review amended terms." },
      { stage: "SWIFT Release", role: "SWIFT Operator", slaHours: 2, description: "Send MT707 amendment." },
    ],
  },
  {
    key: "export_lc_advise",
    module: "Export LC",
    name: "Export LC Advising",
    description: "Advise an inbound MT700 to the beneficiary.",
    steps: [
      { stage: "MT700 Receipt", role: "SWIFT Operator", slaHours: 2, description: "Inbound MT700 logged." },
      { stage: "Authentication", role: "Maker", slaHours: 4, description: "Authenticate issuing bank and parse fields." },
      { stage: "Compliance Check", role: "Compliance", slaHours: 6, description: "Screen issuing bank, applicant, goods.", escalateToRole: "Compliance Head" },
      { stage: "Checker Approval", role: "Checker", slaHours: 4, description: "Verify before advising." },
      { stage: "Advise & MT730", role: "SWIFT Operator", slaHours: 2, description: "Advise beneficiary and acknowledge." },
    ],
  },
  {
    key: "export_lc_negotiation",
    module: "Export LC",
    name: "Export LC Document Negotiation",
    description: "Examine documents under an LC and dispatch.",
    steps: [
      { stage: "Document Receipt", role: "Maker", slaHours: 4, description: "Log presentation against the LC." },
      { stage: "AI Scrutiny", role: "Maker", slaHours: 4, description: "Run AI document scrutiny vs LC terms." },
      { stage: "Checker Approval", role: "Checker", slaHours: 6, description: "Confirm discrepancies, decide on negotiation." },
      { stage: "Finance Booking", role: "Finance Officer", slaHours: 4, description: "Book PC / FDBP / LDBP if requested." },
      { stage: "Dispatch", role: "Back Office", slaHours: 4, description: "Courier docs to issuing bank." },
    ],
  },
  {
    key: "guarantee_issue",
    module: "Guarantee",
    name: "Guarantee Issuance",
    description: "Issue Bid / Performance / Advance / Financial guarantee.",
    steps: [
      { stage: "Application Capture", role: "Maker", slaHours: 4, description: "Capture guarantee request and template." },
      { stage: "Compliance Check", role: "Compliance", slaHours: 6, description: "Screen applicant and beneficiary.", escalateToRole: "Compliance Head" },
      { stage: "Credit Review", role: "Credit Officer", slaHours: 8, description: "Verify limits and counter-indemnity." },
      { stage: "Legal Review", role: "Legal", slaHours: 8, description: "Review wording / non-standard clauses." },
      { stage: "Authorisation", role: "Authoriser", slaHours: 4, description: "Final sign-off." },
      { stage: "SWIFT Release", role: "SWIFT Operator", slaHours: 2, description: "Send MT760." },
    ],
  },
  {
    key: "import_wo_lc_remittance",
    module: "Import w/o LC",
    name: "Import Remittance (Open Account)",
    description: "Outward remittance for open-account import.",
    steps: [
      { stage: "Document Receipt", role: "Maker", slaHours: 4, description: "Receive invoice / BL from importer." },
      { stage: "FX Booking", role: "Treasury", slaHours: 2, description: "Book FX rate." },
      { stage: "Compliance Check", role: "Compliance", slaHours: 6, description: "AML / sanctions / regulatory checks.", escalateToRole: "Compliance Head" },
      { stage: "Checker Approval", role: "Checker", slaHours: 4, description: "Verify payment instruction." },
      { stage: "Payment Release", role: "SWIFT Operator", slaHours: 2, description: "Release MT103 / pacs.008." },
    ],
  },
  {
    key: "export_wo_lc_realization",
    module: "Export w/o LC",
    name: "Export Proceeds Realisation",
    description: "Inward remittance against open-account export.",
    steps: [
      { stage: "Inward Credit", role: "Maker", slaHours: 4, description: "Match MT103 / MT940 with export bill." },
      { stage: "Compliance Check", role: "Compliance", slaHours: 6, description: "Screen remitter / source of funds." },
      { stage: "FX Conversion", role: "Treasury", slaHours: 2, description: "Convert to local currency if required." },
      { stage: "Credit to Customer", role: "Checker", slaHours: 2, description: "Credit beneficiary account." },
    ],
  },
];

export function getDefinition(key: string) {
  return WORKFLOW_DEFINITIONS.find((d) => d.key === key);
}

export interface TaskRow {
  id: string;
  module: string;
  parent_reference: string;
  workflow_key: string;
  stage: string;
  step_index: number;
  assignee_role: string;
  assignee_user: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  sla_hours: number;
  due_at: string;
  started_at: string | null;
  completed_at: string | null;
  comment: string | null;
  data: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditRow {
  id: string;
  task_id: string | null;
  parent_reference: string;
  module: string;
  actor: string | null;
  actor_name: string | null;
  action: string;
  from_stage: string | null;
  to_stage: string | null;
  comment: string | null;
  created_at: string;
}

async function actorInfo() {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  const name = (u?.user_metadata as { full_name?: string } | null)?.full_name || u?.email || "system";
  return { id: u?.id ?? null, name };
}

async function audit(args: {
  task_id?: string | null;
  parent_reference: string;
  module: string;
  action: string;
  from_stage?: string | null;
  to_stage?: string | null;
  comment?: string | null;
}) {
  const a = await actorInfo();
  await supabase.from("workflow_audit").insert({
    task_id: args.task_id ?? null,
    parent_reference: args.parent_reference,
    module: args.module,
    actor: a.id,
    actor_name: a.name,
    action: args.action,
    from_stage: args.from_stage ?? null,
    to_stage: args.to_stage ?? null,
    comment: args.comment ?? null,
  });
}

function dueAt(hours: number) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

/** Start a workflow run for a transaction — creates the first task. */
export async function startWorkflow(args: {
  workflowKey: string;
  parentReference: string;
  priority?: TaskPriority;
  data?: Record<string, unknown>;
}) {
  const def = getDefinition(args.workflowKey);
  if (!def) throw new Error(`Unknown workflow: ${args.workflowKey}`);
  const a = await actorInfo();
  const step = def.steps[0];
  const { data, error } = await supabase
    .from("workflow_tasks")
    .insert({
      module: def.module,
      parent_reference: args.parentReference,
      workflow_key: def.key,
      stage: step.stage,
      step_index: 0,
      assignee_role: step.role,
      status: "Pending",
      priority: args.priority ?? "Normal",
      sla_hours: step.slaHours,
      due_at: dueAt(step.slaHours),
      data: (args.data ?? {}) as never,
      created_by: a.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  await audit({
    task_id: data.id,
    parent_reference: args.parentReference,
    module: def.module,
    action: "Workflow Started",
    to_stage: step.stage,
    comment: def.name,
  });
  return data as TaskRow;
}

/** Claim a task — assign to current user and mark in progress. */
export async function claimTask(taskId: string) {
  const a = await actorInfo();
  const { data: t } = await supabase.from("workflow_tasks").select("*").eq("id", taskId).single();
  const { error } = await supabase
    .from("workflow_tasks")
    .update({ assignee_user: a.id, status: "InProgress", started_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw error;
  if (t)
    await audit({
      task_id: taskId,
      parent_reference: t.parent_reference,
      module: t.module,
      action: "Claimed",
      from_stage: t.stage,
      to_stage: t.stage,
      comment: a.name,
    });
}

/** Reassign a task to another user. */
export async function reassignTask(taskId: string, userId: string, comment?: string) {
  const { data: t } = await supabase.from("workflow_tasks").select("*").eq("id", taskId).single();
  const { error } = await supabase.from("workflow_tasks").update({ assignee_user: userId }).eq("id", taskId);
  if (error) throw error;
  if (t)
    await audit({
      task_id: taskId,
      parent_reference: t.parent_reference,
      module: t.module,
      action: "Reassigned",
      from_stage: t.stage,
      to_stage: t.stage,
      comment,
    });
}

/** Approve a task — advances to next step or completes the workflow. */
export async function approveTask(taskId: string, comment?: string) {
  const { data: t, error } = await supabase.from("workflow_tasks").select("*").eq("id", taskId).single();
  if (error || !t) throw error ?? new Error("Task not found");
  const def = getDefinition(t.workflow_key);
  if (!def) throw new Error("Unknown workflow");
  const a = await actorInfo();
  const nextIdx = t.step_index + 1;
  const isLast = nextIdx >= def.steps.length;
  await supabase
    .from("workflow_tasks")
    .update({
      status: isLast ? "Completed" : "Approved",
      completed_at: new Date().toISOString(),
      comment: comment ?? t.comment,
    })
    .eq("id", taskId);
  await audit({
    task_id: taskId,
    parent_reference: t.parent_reference,
    module: t.module,
    action: isLast ? "Workflow Completed" : "Approved",
    from_stage: t.stage,
    to_stage: isLast ? t.stage : def.steps[nextIdx].stage,
    comment,
  });
  if (!isLast) {
    const next = def.steps[nextIdx];
    const { data: nextRow } = await supabase
      .from("workflow_tasks")
      .insert({
        module: t.module,
        parent_reference: t.parent_reference,
        workflow_key: t.workflow_key,
        stage: next.stage,
        step_index: nextIdx,
        assignee_role: next.role,
        status: "Pending",
        priority: t.priority,
        sla_hours: next.slaHours,
        due_at: dueAt(next.slaHours),
        data: t.data as never,
        created_by: a.id,
      })
      .select("*")
      .single();
    return nextRow as TaskRow;
  }
  return null;
}

/** Reject a task — terminates the workflow. */
export async function rejectTask(taskId: string, comment: string) {
  const { data: t } = await supabase.from("workflow_tasks").select("*").eq("id", taskId).single();
  await supabase
    .from("workflow_tasks")
    .update({ status: "Rejected", completed_at: new Date().toISOString(), comment })
    .eq("id", taskId);
  if (t)
    await audit({
      task_id: taskId,
      parent_reference: t.parent_reference,
      module: t.module,
      action: "Rejected",
      from_stage: t.stage,
      comment,
    });
}

/** Send a task back to the previous step. */
export async function sendBackTask(taskId: string, comment: string) {
  const { data: t } = await supabase.from("workflow_tasks").select("*").eq("id", taskId).single();
  if (!t) return;
  const def = getDefinition(t.workflow_key);
  if (!def) return;
  const prevIdx = Math.max(0, t.step_index - 1);
  const prev = def.steps[prevIdx];
  const a = await actorInfo();
  await supabase
    .from("workflow_tasks")
    .update({ status: "SentBack", completed_at: new Date().toISOString(), comment })
    .eq("id", taskId);
  await audit({
    task_id: taskId,
    parent_reference: t.parent_reference,
    module: t.module,
    action: "Sent Back",
    from_stage: t.stage,
    to_stage: prev.stage,
    comment,
  });
  await supabase.from("workflow_tasks").insert({
    module: t.module,
    parent_reference: t.parent_reference,
    workflow_key: t.workflow_key,
    stage: prev.stage,
    step_index: prevIdx,
    assignee_role: prev.role,
    status: "Pending",
    priority: t.priority,
    sla_hours: prev.slaHours,
    due_at: dueAt(prev.slaHours),
    data: t.data as never,
    created_by: a.id,
  });
}

/** Escalate overdue task to escalation role. */
export async function escalateTask(taskId: string, comment?: string) {
  const { data: t } = await supabase.from("workflow_tasks").select("*").eq("id", taskId).single();
  if (!t) return;
  const def = getDefinition(t.workflow_key);
  const step = def?.steps[t.step_index];
  const newRole = step?.escalateToRole ?? `${t.assignee_role} Supervisor`;
  await supabase
    .from("workflow_tasks")
    .update({ status: "Escalated", assignee_role: newRole, assignee_user: null })
    .eq("id", taskId);
  await audit({
    task_id: taskId,
    parent_reference: t.parent_reference,
    module: t.module,
    action: "Escalated",
    from_stage: t.stage,
    to_stage: t.stage,
    comment: comment ?? `Escalated to ${newRole}`,
  });
}

export async function listTasks(filters?: { status?: TaskStatus | "all"; module?: string; mine?: boolean }) {
  let q = supabase.from("workflow_tasks").select("*").order("due_at", { ascending: true });
  if (filters?.status && filters.status !== "all") q = q.eq("status", filters.status);
  if (filters?.module && filters.module !== "all") q = q.eq("module", filters.module);
  if (filters?.mine) {
    const { data } = await supabase.auth.getUser();
    if (data.user) q = q.eq("assignee_user", data.user.id);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TaskRow[];
}

export async function listAudit(parentReference?: string) {
  let q = supabase.from("workflow_audit").select("*").order("created_at", { ascending: false }).limit(200);
  if (parentReference) q = q.eq("parent_reference", parentReference);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AuditRow[];
}

export function isOverdue(task: { due_at: string; status: string }) {
  if (["Completed", "Rejected", "Approved"].includes(task.status)) return false;
  return new Date(task.due_at).getTime() < Date.now();
}

export function slaPercent(task: { due_at: string; sla_hours: number; created_at: string }) {
  const total = task.sla_hours * 3600_000;
  const elapsed = Date.now() - new Date(task.created_at).getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}
