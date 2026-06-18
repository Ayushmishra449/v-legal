"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/index";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-orange-100 text-orange-700",
  MANAGER: "bg-blue-100 text-blue-700",
  LEGAL_TEAM: "bg-purple-100 text-purple-700",
  FINANCE: "bg-green-100 text-green-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

export function ApprovalForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    module: "DOCUMENT",
    moduleRefLabel: "",
    oneDriveLink: "",
    priority: "NORMAL",
    workflowId: "",
    currentApproverId: "",
    dueDate: "",
  });

  // Load workflows for selection
  const { data: workflows } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => fetch("/api/approvals/workflows").then((r) => r.json()),
  });

  // Load users for approver assignment
  const { data: users } = useQuery({
    queryKey: ["all-users-for-approvals"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
  });

  const activeWorkflows = Array.isArray(workflows) ? workflows.filter((w: any) => w.isActive) : [];
  const userList = Array.isArray(users) ? users.filter((u: any) => u.isActive) : [];

  const selectedWorkflow = activeWorkflows.find((w: any) => w.id === formData.workflowId);

  const create = useMutation({
    mutationFn: (d: any) =>
      fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(typeof res.error === "string" ? res.error : "Failed to submit request");
        return;
      }
      qc.invalidateQueries({ queryKey: ["approvals"] });
      toast.success("Approval request submitted");
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required");
    if (!formData.currentApproverId) return toast.error("Please assign an approver");
    create.mutate({
      ...formData,
      workflowId: formData.workflowId || null,
      dueDate: formData.dueDate || null,
    });
  };

  const inp =
    "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Request Title *</label>
        <input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={inp}
          placeholder="e.g. Approval needed for retainer agreement with AZB & Partners"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Module / Type</label>
          <select value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })} className={inp}>
            <option value="DOCUMENT">Document</option>
            <option value="INVOICE">Invoice</option>
            <option value="MATTER">Matter</option>
            <option value="NOTICE">Notice</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
          <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className={inp}>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Reference ID (optional)</label>
          <input
            value={formData.moduleRefLabel}
            onChange={(e) => setFormData({ ...formData, moduleRefLabel: e.target.value })}
            className={inp}
            placeholder="e.g. INV-2026-042 or LM-2026-007"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Due Date (optional)</label>
          <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className={inp} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">OneDrive / SharePoint Link</label>
        <input
          value={formData.oneDriveLink}
          onChange={(e) => setFormData({ ...formData, oneDriveLink: e.target.value })}
          className={inp}
          placeholder="https://vikramsolar-my.sharepoint.com/..."
        />
      </div>

      {/* Workflow selection */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Workflow (optional)</label>
        <select value={formData.workflowId} onChange={(e) => setFormData({ ...formData, workflowId: e.target.value })} className={inp}>
          <option value="">No workflow — single approver</option>
          {activeWorkflows.map((w: any) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.module})
            </option>
          ))}
        </select>
        {selectedWorkflow && selectedWorkflow.steps?.length > 0 && (
          <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1">
            {selectedWorkflow.steps.map((step: any, i: number) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap border border-current/20",
                    ROLE_COLORS[step.approverRole] || "bg-slate-100 text-slate-700"
                  )}
                >
                  {step.stepOrder}. {step.stepName}
                </div>
                {i < selectedWorkflow.steps.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 mx-0.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approver assignment */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Assign to (Approver) *</label>
        <select
          value={formData.currentApproverId}
          onChange={(e) => setFormData({ ...formData, currentApproverId: e.target.value })}
          className={inp}
        >
          <option value="">Select approver...</option>
          {userList.map((u: any) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role.replace(/_/g, " ")}) — {u.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description / Notes</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className={cn(inp, "resize-none")}
          placeholder="Add context for the approver..."
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={create.isPending}>
          Submit Request
        </Button>
      </div>
    </form>
  );
}
