"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { ApprovalStatusPill } from "./StatusPill";
import { formatDate, cn } from "@/lib/utils";
import {
  X, CheckCircle2, XCircle, ArrowRightLeft, AlertTriangle,
  Link as LinkIcon, MessageSquare, Send, ArrowRight,
} from "lucide-react";
import { useSession } from "next-auth/react";

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-orange-100 text-orange-700",
  MANAGER: "bg-blue-100 text-blue-700",
  LEGAL_TEAM: "bg-purple-100 text-purple-700",
  FINANCE: "bg-green-100 text-green-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

const ACTION_CONFIG: Record<string, { color: string; dotColor: string; verb: string }> = {
  SUBMITTED: { color: "text-blue-600", dotColor: "bg-blue-500", verb: "submitted the request" },
  APPROVED: { color: "text-green-600", dotColor: "bg-green-500", verb: "approved" },
  REJECTED: { color: "text-red-600", dotColor: "bg-red-500", verb: "rejected" },
  COMMENTED: { color: "text-slate-600", dotColor: "bg-slate-400", verb: "commented" },
  REVOKED: { color: "text-amber-600", dotColor: "bg-amber-500", verb: "revoked" },
  REASSIGNED: { color: "text-indigo-600", dotColor: "bg-indigo-500", verb: "reassigned" },
};

export function ApprovalDetails({ approvalId, onClose }: { approvalId: string; onClose: () => void }) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [showReassign, setShowReassign] = useState(false);
  const [reassignToId, setReassignToId] = useState("");

  const { data: approval, isLoading, error } = useQuery({
    queryKey: ["approval", approvalId],
    queryFn: () => fetch(`/api/approvals/${approvalId}`).then((r) => r.json()),
  });

  const { data: users } = useQuery({
    queryKey: ["all-users-for-approvals"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
  });

  const userList = Array.isArray(users) ? users.filter((u: any) => u.isActive) : [];

  const actionMutation = useMutation({
    mutationFn: (d: any) =>
      fetch(`/api/approvals/${approvalId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return; }
      qc.invalidateQueries({ queryKey: ["approval", approvalId] });
      qc.invalidateQueries({ queryKey: ["approvals"] });
      setComment("");
      setShowReassign(false);
      setReassignToId("");
      toast.success("Action recorded");
    },
  });

  const handleAction = (type: string) => {
    if ((type === "REJECTED" || type === "REVOKED") && !comment) {
      toast.error("Please provide a reason");
      return;
    }
    if (type === "REASSIGNED") {
      if (!reassignToId) return toast.error("Select a user to reassign to");
      const toUser = userList.find((u: any) => u.id === reassignToId);
      actionMutation.mutate({ actionType: type, comment, toUserId: reassignToId, toUserName: toUser?.name });
      return;
    }
    actionMutation.mutate({ actionType: type, comment });
  };

  const handleComment = () => {
    if (!comment.trim()) return toast.error("Comment cannot be empty");
    actionMutation.mutate({ actionType: "COMMENTED", comment });
  };

  if (isLoading) return <SlideOverShell onClose={onClose}><LoadingSpinner /></SlideOverShell>;
  if (error || !approval) return <SlideOverShell onClose={onClose}><ErrorState /></SlideOverShell>;

  const isApprover = approval.currentApprover?.id === session?.user?.id;
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(session?.user?.role || "");
  const isSubmitter = approval.submittedBy?.id === session?.user?.id;
  const canApprove = (isApprover || isAdmin) && approval.status === "PENDING";
  const canRevoke = (isSubmitter || isAdmin) && approval.status === "PENDING";
  const isPending = approval.status === "PENDING";

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[520px] bg-white shadow-2xl flex flex-col z-[100] border-l border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{approval.approvalId}</span>
              <ApprovalStatusPill status={approval.status} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{approval.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Workflow step visualization */}
          {approval.workflow && approval.workflow.steps?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Workflow Progress</h3>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {approval.workflow.steps.map((step: any, i: number) => {
                  const isComplete = step.stepOrder < approval.currentStep;
                  const isCurrent = step.stepOrder === approval.currentStep;
                  const isFuture = step.stepOrder > approval.currentStep;
                  const isRejected = approval.status === "REJECTED" && isCurrent;

                  return (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap border-2 transition-all",
                          isComplete && "bg-green-50 text-green-700 border-green-300",
                          isCurrent && !isRejected && "bg-amber-50 text-amber-700 border-amber-400 ring-2 ring-amber-200",
                          isRejected && "bg-red-50 text-red-700 border-red-400 ring-2 ring-red-200",
                          isFuture && "bg-slate-50 text-slate-400 border-slate-200"
                        )}
                      >
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                          isComplete && "bg-green-200",
                          isCurrent && "bg-amber-200",
                          isRejected && "bg-red-200",
                          isFuture && "bg-slate-200"
                        )}>
                          {isComplete ? "✓" : step.stepOrder}
                        </span>
                        {step.stepName}
                      </div>
                      {i < approval.workflow.steps.length - 1 && (
                        <ArrowRight className={cn("w-4 h-4 mx-1 flex-shrink-0", isComplete ? "text-green-400" : "text-slate-200")} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <div className="text-slate-500 text-xs mb-1">Submitted By</div>
              <div className="font-medium text-slate-900">{approval.submittedBy?.name}</div>
              <div className="text-slate-400 text-xs">{approval.submittedBy?.email}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">Submitted On</div>
              <div className="font-medium text-slate-900">{formatDate(approval.createdAt)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">Module / Reference</div>
              <div className="font-medium text-slate-900">{approval.module}</div>
              {approval.moduleRefLabel && <div className="text-slate-400 text-xs">{approval.moduleRefLabel}</div>}
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-1">Current Approver</div>
              <div className="font-medium text-slate-900">{approval.currentApprover?.name || "—"}</div>
              {approval.currentApprover?.role && (
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", ROLE_COLORS[approval.currentApprover.role] || "bg-slate-100 text-slate-500")}>
                  {approval.currentApprover.role.replace(/_/g, " ")}
                </span>
              )}
            </div>
            {approval.dueDate && (
              <div>
                <div className="text-slate-500 text-xs mb-1">Due Date</div>
                <div className="font-medium text-slate-900">{formatDate(approval.dueDate)}</div>
              </div>
            )}
            <div>
              <div className="text-slate-500 text-xs mb-1">Priority</div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                approval.priority === "URGENT" || approval.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
              )}>{approval.priority}</span>
            </div>
          </div>

          {/* OneDrive link */}
          {approval.oneDriveLink && (
            <a href={approval.oneDriveLink} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 p-3 rounded-lg border border-blue-100 transition-colors">
              <LinkIcon className="w-4 h-4" /> View attached document on OneDrive
            </a>
          )}

          {/* Description */}
          {approval.description && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
              <div className="text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">{approval.description}</div>
            </div>
          )}

          {/* Audit Trail */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Audit Trail ({approval.actions?.length || 0})
            </h3>
            <div className="space-y-0 relative">
              <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-slate-100" />
              {approval.actions?.map((act: any) => {
                const cfg = ACTION_CONFIG[act.actionType] || ACTION_CONFIG.COMMENTED;
                return (
                  <div key={act.id} className="relative pl-7 pb-5">
                    <div className={cn("absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white z-10", cfg.dotColor)} />
                    <div className="text-sm">
                      <span className={cn("font-semibold", cfg.color)}>{act.actor?.name}</span>
                      <span className="text-slate-500 mx-1.5">{cfg.verb}</span>
                      {act.actionType === "REASSIGNED" && act.toUserName && (
                        <span className="font-medium text-indigo-600">→ {act.toUserName}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{new Date(act.createdAt).toLocaleString()}</div>
                    {act.comment && (
                      <div className="mt-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 p-3 rounded-lg">{act.comment}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0 space-y-3">
          {/* Comment input — always visible */}
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isPending ? "Add comment or reason..." : "Add a comment..."}
              className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <button onClick={handleComment} disabled={actionMutation.isPending}
              className="px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
              title="Add comment">
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Reassign section */}
          {showReassign && (
            <div className="flex gap-2">
              <select value={reassignToId} onChange={(e) => setReassignToId(e.target.value)}
                className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white">
                <option value="">Select user to reassign to...</option>
                {userList.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.replace(/_/g, " ")})</option>
                ))}
              </select>
              <Button size="sm" variant="primary" onClick={() => handleAction("REASSIGNED")} loading={actionMutation.isPending}>
                Reassign
              </Button>
            </div>
          )}

          {/* Action buttons */}
          {canApprove && (
            <div className="flex gap-2">
              <Button className="flex-1" variant="primary" onClick={() => handleAction("APPROVED")} loading={actionMutation.isPending}>
                <CheckCircle2 className="w-4 h-4" /> Approve
              </Button>
              <Button className="flex-1 bg-white hover:bg-red-50 hover:text-red-600 border-red-200" variant="secondary"
                onClick={() => handleAction("REJECTED")} loading={actionMutation.isPending}>
                <XCircle className="w-4 h-4" /> Reject
              </Button>
              <Button variant="secondary" onClick={() => setShowReassign(!showReassign)} loading={actionMutation.isPending}>
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
          {canRevoke && !canApprove && (
            <Button className="w-full" variant="secondary" onClick={() => handleAction("REVOKED")} loading={actionMutation.isPending}>
              <AlertTriangle className="w-4 h-4" /> Revoke Request
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function SlideOverShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-[520px] bg-white shadow-2xl flex flex-col z-[100] border-l border-slate-200 items-center justify-center">
        {children}
      </div>
    </>
  );
}
