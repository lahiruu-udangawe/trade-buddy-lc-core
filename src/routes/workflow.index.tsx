import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  WORKFLOW_DEFINITIONS,
  startWorkflow,
  approveTask,
  rejectTask,
  sendBackTask,
  claimTask,
  escalateTask,
  listTasks,
  listAudit,
  isOverdue,
  slaPercent,
  type TaskRow,
  type AuditRow,
} from "@/lib/workflow-engine";
import { AlertTriangle, CheckCircle2, Clock, Workflow, Users, ArrowRight, History, Play, RotateCcw, XCircle, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/workflow/")({ component: WorkflowPage });

const STATUS_COLOR: Record<string, string> = {
  Pending: "bg-status-warning/10 text-status-warning",
  InProgress: "bg-status-submitted/10 text-status-submitted",
  Approved: "bg-status-approved/10 text-status-approved",
  Completed: "bg-status-issued/10 text-status-issued",
  Rejected: "bg-status-error/10 text-status-error",
  SentBack: "bg-muted text-foreground",
  Escalated: "bg-status-error/10 text-status-error",
};

function WorkflowPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("queue");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showStart, setShowStart] = useState(false);
  const [actDialog, setActDialog] = useState<{ task: TaskRow; mode: "approve" | "reject" | "back" } | null>(null);
  const [comment, setComment] = useState("");

  const refresh = async () => {
    setLoading(true);
    const [t, a] = await Promise.all([listTasks(), listAudit()]);
    setTasks(t);
    setAudit(a);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (moduleFilter === "all" || t.module === moduleFilter) &&
          (statusFilter === "all" || t.status === statusFilter),
      ),
    [tasks, moduleFilter, statusFilter],
  );

  const metrics = useMemo(() => {
    const open = tasks.filter((t) => !["Completed", "Rejected"].includes(t.status));
    const overdue = open.filter(isOverdue);
    const completedToday = tasks.filter(
      (t) => t.status === "Completed" && t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString(),
    );
    const escalated = tasks.filter((t) => t.status === "Escalated");
    return { open: open.length, overdue: overdue.length, completedToday: completedToday.length, escalated: escalated.length };
  }, [tasks]);

  const handleAction = async () => {
    if (!actDialog) return;
    try {
      if (actDialog.mode === "approve") await approveTask(actDialog.task.id, comment);
      if (actDialog.mode === "reject") {
        if (!comment.trim()) return toast.error("Comment required to reject");
        await rejectTask(actDialog.task.id, comment);
      }
      if (actDialog.mode === "back") {
        if (!comment.trim()) return toast.error("Comment required to send back");
        await sendBackTask(actDialog.task.id, comment);
      }
      toast.success("Action recorded");
      setActDialog(null);
      setComment("");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Workflow className="h-6 w-6 text-primary" /> Workflow Engine
          </h1>
          <p className="text-sm text-muted-foreground">Central orchestration of approvals, routing, SLA & escalations across all trade modules.</p>
        </div>
        <Button onClick={() => setShowStart(true)}>
          <Play className="h-4 w-4 mr-2" /> Start Workflow
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Open tasks" value={metrics.open} icon={<Clock className="h-4 w-4" />} />
        <MetricCard label="Overdue" value={metrics.overdue} tone="error" icon={<AlertTriangle className="h-4 w-4" />} />
        <MetricCard label="Escalated" value={metrics.escalated} tone="error" icon={<ChevronUp className="h-4 w-4" />} />
        <MetricCard label="Completed today" value={metrics.completedToday} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="queue">Work Queue</TabsTrigger>
          <TabsTrigger value="definitions">Definitions</TabsTrigger>
          <TabsTrigger value="sla">SLA Monitor</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {Array.from(new Set(WORKFLOW_DEFINITIONS.map((d) => d.module))).map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {["Pending", "InProgress", "Escalated", "Approved", "Completed", "Rejected", "SentBack"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Reference</th>
                    <th className="px-4 py-2">Module</th>
                    <th className="px-4 py-2">Stage</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 w-40">SLA</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No tasks. Start a workflow to populate the queue.</td></tr>
                  )}
                  {filtered.map((t) => {
                    const overdue = isOverdue(t);
                    return (
                      <tr key={t.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-2 font-mono text-xs">{t.parent_reference}</td>
                        <td className="px-4 py-2">{t.module}</td>
                        <td className="px-4 py-2">{t.stage}</td>
                        <td className="px-4 py-2"><Badge variant="outline">{t.assignee_role}</Badge></td>
                        <td className="px-4 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[t.status] ?? "bg-muted"}`}>{t.status}</span>
                        </td>
                        <td className="px-4 py-2">
                          <Progress value={slaPercent(t)} className={overdue ? "[&>div]:bg-destructive" : ""} />
                          <div className={`text-[10px] mt-1 ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                            {overdue ? "Overdue · " : "Due "}{new Date(t.due_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right space-x-1">
                          {t.status === "Pending" && (
                            <Button size="sm" variant="outline" onClick={() => claimTask(t.id).then(refresh)}>Claim</Button>
                          )}
                          {!["Completed", "Rejected", "Approved", "SentBack"].includes(t.status) && (
                            <>
                              <Button size="sm" onClick={() => { setActDialog({ task: t, mode: "approve" }); setComment(""); }}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setActDialog({ task: t, mode: "back" }); setComment(""); }}>
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => { setActDialog({ task: t, mode: "reject" }); setComment(""); }}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                              {overdue && t.status !== "Escalated" && (
                                <Button size="sm" variant="ghost" onClick={() => escalateTask(t.id).then(refresh)}>
                                  <ChevronUp className="h-3.5 w-3.5" /> Escalate
                                </Button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="definitions" className="space-y-4">
          {WORKFLOW_DEFINITIONS.map((d) => (
            <Card key={d.key}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="secondary">{d.module}</Badge> {d.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{d.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  {d.steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="rounded-md border bg-card px-3 py-2 text-xs">
                        <div className="font-medium">{s.stage}</div>
                        <div className="text-muted-foreground flex items-center gap-2 mt-0.5">
                          <Users className="h-3 w-3" /> {s.role} · <Clock className="h-3 w-3" /> {s.slaHours}h
                        </div>
                      </div>
                      {i < d.steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sla">
          <Card>
            <CardHeader><CardTitle className="text-base">SLA / TAT Monitor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {tasks.filter((t) => !["Completed", "Rejected"].includes(t.status)).map((t) => {
                const pct = slaPercent(t);
                const od = isOverdue(t);
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="w-48 text-xs">
                      <div className="font-mono">{t.parent_reference}</div>
                      <div className="text-muted-foreground">{t.module} · {t.stage}</div>
                    </div>
                    <div className="flex-1">
                      <Progress value={pct} className={od ? "[&>div]:bg-destructive" : pct > 75 ? "[&>div]:bg-status-warning" : ""} />
                    </div>
                    <div className={`text-xs w-32 text-right ${od ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                      {od ? "OVERDUE" : `${Math.round(pct)}% of ${t.sla_hours}h`}
                    </div>
                  </div>
                );
              })}
              {tasks.filter((t) => !["Completed", "Rejected"].includes(t.status)).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">No active tasks.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Workflow Audit Trail</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Reference</th>
                    <th className="px-4 py-2">Module</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Stage</th>
                    <th className="px-4 py-2">Actor</th>
                    <th className="px-4 py-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.id} className="border-b">
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 font-mono text-xs">{a.parent_reference}</td>
                      <td className="px-4 py-2 text-xs">{a.module}</td>
                      <td className="px-4 py-2 text-xs font-medium">{a.action}</td>
                      <td className="px-4 py-2 text-xs">{a.from_stage}{a.to_stage && a.to_stage !== a.from_stage ? ` → ${a.to_stage}` : ""}</td>
                      <td className="px-4 py-2 text-xs">{a.actor_name}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{a.comment}</td>
                    </tr>
                  ))}
                  {audit.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No audit entries yet.</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StartWorkflowDialog open={showStart} onClose={() => setShowStart(false)} onStarted={refresh} />

      <Dialog open={!!actDialog} onOpenChange={(o) => !o && setActDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actDialog?.mode === "approve" && "Approve Task"}
              {actDialog?.mode === "reject" && "Reject Task"}
              {actDialog?.mode === "back" && "Send Back Task"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {actDialog?.task.parent_reference} · {actDialog?.task.stage}
            </div>
            <Textarea
              placeholder={actDialog?.mode === "approve" ? "Optional comment" : "Reason (required)"}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActDialog(null)}>Cancel</Button>
            <Button onClick={handleAction} variant={actDialog?.mode === "reject" ? "destructive" : "default"}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ label, value, tone, icon }: { label: string; value: number; tone?: "success" | "error"; icon: React.ReactNode }) {
  const color = tone === "error" ? "text-destructive" : tone === "success" ? "text-status-approved" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">{label}{icon}</div>
        <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function StartWorkflowDialog({ open, onClose, onStarted }: { open: boolean; onClose: () => void; onStarted: () => void }) {
  const [key, setKey] = useState(WORKFLOW_DEFINITIONS[0].key);
  const [ref, setRef] = useState("");
  const [priority, setPriority] = useState<"Low" | "Normal" | "High" | "Urgent">("Normal");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!ref.trim()) return toast.error("Reference is required");
    setBusy(true);
    try {
      await startWorkflow({ workflowKey: key, parentReference: ref.trim(), priority });
      toast.success("Workflow started");
      setRef("");
      onStarted();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Start a Workflow</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Workflow</label>
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORKFLOW_DEFINITIONS.map((d) => (
                  <SelectItem key={d.key} value={d.key}>{d.module} — {d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Transaction reference</label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. ILC-2026-00045" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Low", "Normal", "High", "Urgent"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Starting…" : "Start"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
