"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { PageHeader, Card, Button, EmptyState, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { cn } from "@/lib/utils";
import { Plus, Edit2, Trash2, GitBranch, ArrowRight, ChevronDown, ChevronUp, Power } from "lucide-react";
import { motion } from "framer-motion";

const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "LEGAL_TEAM", "FINANCE", "VIEWER"] as const;
const MODULES = ["DOCUMENT", "MATTER", "INVOICE", "HEARING", "NOTICE", "OTHER"] as const;

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-orange-100 text-orange-700",
  MANAGER: "bg-blue-100 text-blue-700",
  LEGAL_TEAM: "bg-purple-100 text-purple-700",
  FINANCE: "bg-green-100 text-green-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

interface Step {
  stepOrder: number;
  stepName: string;
  approverRole: string;
  description: string;
}

function WorkflowForm({
  defaultValues,
  onSave,
  loading,
}: {
  defaultValues?: { name: string; description: string; module: string; isActive: boolean; steps: Step[] };
  onSave: (data: any) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [description, setDescription] = useState(defaultValues?.description || "");
  const [module, setModule] = useState(defaultValues?.module || "DOCUMENT");
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [steps, setSteps] = useState<Step[]>(
    defaultValues?.steps || [{ stepOrder: 1, stepName: "Legal Review", approverRole: "LEGAL_TEAM", description: "" }]
  );

  const addStep = () => {
    setSteps([...steps, { stepOrder: steps.length + 1, stepName: "", approverRole: "MANAGER", description: "" }]);
  };

  const removeStep = (i: number) => {
    const newSteps = steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, stepOrder: idx + 1 }));
    setSteps(newSteps);
  };

  const updateStep = (i: number, field: keyof Step, value: string) => {
    const newSteps = [...steps];
    (newSteps[i] as any)[field] = value;
    setSteps(newSteps);
  };

  const moveStep = (i: number, dir: -1 | 1) => {
    if ((dir === -1 && i === 0) || (dir === 1 && i === steps.length - 1)) return;
    const newSteps = [...steps];
    const temp = newSteps[i];
    newSteps[i] = newSteps[i + dir];
    newSteps[i + dir] = temp;
    setSteps(newSteps.map((s, idx) => ({ ...s, stepOrder: idx + 1 })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error("Workflow name is required");
    if (steps.length === 0) return toast.error("At least one step is required");
    if (steps.some((s) => !s.stepName)) return toast.error("All steps must have a name");
    onSave({ name, description, module, isActive, steps });
  };

  const inp =
    "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Workflow Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="e.g. Legal Document Approval" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Module</label>
          <select value={module} onChange={(e) => setModule(e.target.value)} className={inp}>
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={cn(inp, "resize-none")} placeholder="Describe when this workflow should be used..." />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-slate-600">Active:</label>
        <button type="button" onClick={() => setIsActive(!isActive)} className={cn("relative w-10 h-5 rounded-full transition-colors", isActive ? "bg-green-500" : "bg-slate-300")}>
          <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", isActive ? "left-5" : "left-0.5")} />
        </button>
      </div>

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Approval Steps</h3>
          <button type="button" onClick={addStep} className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Step
          </button>
        </div>

        {/* Visual pipeline */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap", ROLE_COLORS[step.approverRole] || "bg-slate-100 text-slate-700", "border-current/20")}>
                <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-[10px] font-bold">{step.stepOrder}</span>
                {step.stepName || `Step ${step.stepOrder}`}
              </div>
              {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300 mx-1 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step detail cards */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-4 bg-white relative">
              <div className="absolute top-2 right-2 flex gap-1">
                <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(i)} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 font-semibold mb-2">STEP {step.stepOrder}</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Step Name *</label>
                  <input value={step.stepName} onChange={(e) => updateStep(i, "stepName", e.target.value)} className={inp} placeholder="e.g. Legal Review" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Approver Role *</label>
                  <select value={step.approverRole} onChange={(e) => updateStep(i, "approverRole", e.target.value)} className={inp}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>
          Save Workflow
        </Button>
      </div>
    </form>
  );
}

export default function WorkflowsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);

  const { data: workflows, isLoading, error } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => fetch("/api/approvals/workflows").then((r) => r.json()),
  });

  const create = useMutation({
    mutationFn: (d: any) =>
      fetch("/api/approvals/workflows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error(typeof res.error === "string" ? res.error : "Failed"); return; }
      qc.invalidateQueries({ queryKey: ["workflows"] });
      setModal(null);
      toast.success("Workflow created");
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetch(`/api/approvals/workflows/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error("Failed"); return; }
      qc.invalidateQueries({ queryKey: ["workflows"] });
      setModal(null);
      toast.success("Workflow updated");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => fetch(`/api/approvals/workflows/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted");
    },
  });

  const items = Array.isArray(workflows) ? workflows : [];

  return (
    <div>
      <PageHeader
        title="Approval Workflows"
        subtitle="Configure multi-step approval pipelines. Super Admin only."
        actions={
          <Button variant="primary" onClick={() => { setEditing(null); setModal("add"); }}>
            <Plus className="w-4 h-4" /> New Workflow
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message="Access denied or failed to load workflows" />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<GitBranch className="w-6 h-6 text-slate-400" />}
            title="No workflows configured"
            description="Create your first approval workflow to define who reviews and approves documents."
            action={
              <Button variant="primary" onClick={() => setModal("add")}>
                <Plus className="w-4 h-4" /> New Workflow
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((wf: any, idx: number) => (
            <motion.div key={wf.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-slate-900">{wf.name}</h3>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", wf.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                          {wf.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{wf.module}</span>
                      </div>
                      {wf.description && <p className="text-sm text-slate-500">{wf.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditing(wf); setModal("edit"); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete workflow "${wf.name}"?`)) remove.mutate(wf.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Visual pipeline */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {wf.steps?.map((step: any, i: number) => (
                      <div key={step.id} className="flex items-center">
                        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap border", ROLE_COLORS[step.approverRole] || "bg-slate-100 text-slate-700", "border-current/20")}>
                          <span className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-[10px] font-bold">{step.stepOrder}</span>
                          {step.stepName}
                          <span className="text-[10px] opacity-60">({step.approverRole.replace(/_/g, " ")})</span>
                        </div>
                        {i < wf.steps.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300 mx-1 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "edit" ? "Edit Workflow" : "New Workflow"} size="xl">
        <WorkflowForm
          loading={create.isPending || update.isPending}
          defaultValues={
            modal === "edit" && editing
              ? {
                  name: editing.name,
                  description: editing.description || "",
                  module: editing.module,
                  isActive: editing.isActive,
                  steps: editing.steps?.map((s: any) => ({
                    stepOrder: s.stepOrder,
                    stepName: s.stepName,
                    approverRole: s.approverRole,
                    description: s.description || "",
                  })) || [],
                }
              : undefined
          }
          onSave={(d: any) => (modal === "edit" && editing ? update.mutate({ id: editing.id, data: d }) : create.mutate(d))}
        />
      </Modal>
    </div>
  );
}
