import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRightLeft } from "lucide-react";

export function ApprovalStatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    PENDING: { bg: "bg-amber-50", text: "text-amber-600", icon: Clock, label: "Pending" },
    APPROVED: { bg: "bg-green-50", text: "text-green-600", icon: CheckCircle2, label: "Approved" },
    REJECTED: { bg: "bg-red-50", text: "text-red-600", icon: XCircle, label: "Rejected" },
    REVOKED: { bg: "bg-slate-100", text: "text-slate-600", icon: AlertTriangle, label: "Revoked" },
    REASSIGNED: { bg: "bg-blue-50", text: "text-blue-600", icon: ArrowRightLeft, label: "Reassigned" },
  };

  const c = config[status] || config.PENDING;
  const Icon = c.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-current/10", c.bg, c.text)}>
      <Icon className="w-3.5 h-3.5" />
      {c.label}
    </div>
  );
}
