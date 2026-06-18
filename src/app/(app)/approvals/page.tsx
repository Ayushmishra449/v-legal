"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { PageHeader, Card, Button, EmptyState, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { formatDate, cn } from "@/lib/utils";
import { Plus, Search, ClipboardList, Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { ApprovalStatusPill } from "./StatusPill";
import { ApprovalForm } from "./ApprovalForm";
import { ApprovalDetails } from "./ApprovalDetails";

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewFilter, setViewFilter] = useState("ALL"); // ALL, ASSIGNED_TO_ME, SUBMITTED_BY_ME
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"add" | "details" | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["approvals", search, statusFilter, viewFilter, page],
    queryFn: () => {
      const p = new URLSearchParams({ search, status: statusFilter, page: String(page), limit: "20" });
      if (viewFilter === "ASSIGNED_TO_ME") p.append("assignedToMe", "true");
      if (viewFilter === "SUBMITTED_BY_ME") p.append("submittedByMe", "true");
      return fetch(`/api/approvals?${p.toString()}`).then((r) => r.json());
    },
    refetchInterval: 30000,
  });

  const approvals = data?.approvals ?? [];

  return (
    <div>
      <PageHeader
        title="Approvals Workspace"
        subtitle={`${data?.total ?? 0} approval requests`}
        actions={
          <Button variant="primary" onClick={() => setModal("add")}>
            <Plus className="w-4 h-4" /> New Request
          </Button>
        }
      />

      <div className="mb-4 flex gap-2 border-b border-slate-200">
        {[
          { id: "ALL", label: "All Requests" },
          { id: "ASSIGNED_TO_ME", label: "Assigned to Me" },
          { id: "SUBMITTED_BY_ME", label: "Submitted by Me" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setViewFilter(tab.id); setPage(1); }}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              viewFilter === tab.id
                ? "border-red-600 text-red-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="p-4 flex gap-3 flex-wrap" style={{ borderBottom: "1px solid #F1F3F7" }}>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by ID, title, or reference..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVOKED">Revoked</option>
            <option value="REASSIGNED">Reassigned</option>
          </select>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState />
        ) : approvals.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-6 h-6 text-slate-400" />}
            title="No approvals found"
            description="There are no approval requests matching your criteria."
            action={
              <Button variant="primary" onClick={() => setModal("add")}>
                <Plus className="w-4 h-4" /> New Request
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F1F3F7" }}>
                  {["ID", "Title", "Module / Ref", "Submitted By", "Current Approver", "Priority", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvals.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors"
                    style={{ borderBottom: "1px solid #F1F3F7" }}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.approvalId}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">{item.title}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      <span className="font-semibold text-slate-700">{item.module}</span>
                      {item.moduleRefLabel && <span className="text-slate-400 block">{item.moduleRefLabel}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{item.submittedBy?.name}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{item.currentApprover?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          item.priority === "URGENT" || item.priority === "HIGH"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ApprovalStatusPill status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedApproval(item);
                          setModal("details");
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid #F1F3F7" }}>
            <p className="text-xs text-slate-500">
              Page {page} of {data.pages}
            </p>
            <div className="flex gap-1">
              <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Prev
              </Button>
              <Button size="sm" onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={modal === "add"} onClose={() => setModal(null)} title="New Approval Request" size="lg">
        <ApprovalForm onClose={() => setModal(null)} />
      </Modal>

      {/* Slide-over details panel */}
      {modal === "details" && selectedApproval && (
        <ApprovalDetails approvalId={selectedApproval.id} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
