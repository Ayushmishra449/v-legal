import { cn } from "@/lib/utils";
import { MatterStatus, HearingStatus, PaymentStatus, NoticeStatus, NoticeDirection, Role } from "@prisma/client";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/rbac";

type PillVariant = "blue" | "green" | "red" | "amber" | "purple" | "gray" | "teal";

const PILL_STYLES: Record<PillVariant, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  gray: "bg-slate-50 text-slate-600 border-slate-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
};

interface StatusPillProps {
  children: React.ReactNode;
  variant: PillVariant;
  className?: string;
}

export function StatusPill({ children, variant, className }: StatusPillProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
      PILL_STYLES[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function MatterStatusPill({ status }: { status: MatterStatus }) {
  const map: Record<MatterStatus, { label: string; variant: PillVariant }> = {
    ONGOING: { label: "Ongoing", variant: "blue" },
    SETTLED: { label: "Settled", variant: "green" },
    CLOSED: { label: "Closed", variant: "gray" },
    DISMISSED: { label: "Dismissed", variant: "gray" },
    STAY_GRANTED: { label: "Stay Granted", variant: "amber" },
  };
  const { label, variant } = map[status];
  return <StatusPill variant={variant}>{label}</StatusPill>;
}

export function HearingStatusPill({ status }: { status: HearingStatus }) {
  const map: Record<HearingStatus, { label: string; variant: PillVariant }> = {
    SCHEDULED: { label: "Scheduled", variant: "blue" },
    HEARD: { label: "Heard", variant: "teal" },
    ADJOURNED: { label: "Adjourned", variant: "amber" },
    ORDER_PASSED: { label: "Order Passed", variant: "green" },
  };
  const { label, variant } = map[status];
  return <StatusPill variant={variant}>{label}</StatusPill>;
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, { label: string; variant: PillVariant }> = {
    PENDING: { label: "Pending", variant: "amber" },
    PAID: { label: "Paid", variant: "green" },
    REJECTED: { label: "Rejected", variant: "red" },
  };
  const { label, variant } = map[status];
  return <StatusPill variant={variant}>{label}</StatusPill>;
}

export function NoticeStatusPill({ status }: { status: NoticeStatus }) {
  const map: Record<NoticeStatus, { label: string; variant: PillVariant }> = {
    PENDING_REPLY: { label: "Pending Reply", variant: "red" },
    REPLIED: { label: "Replied", variant: "green" },
    SENT: { label: "Sent", variant: "blue" },
    NO_REPLY_REQUIRED: { label: "No Reply Needed", variant: "gray" },
  };
  const { label, variant } = map[status];
  return <StatusPill variant={variant}>{label}</StatusPill>;
}

export function DirectionPill({ direction }: { direction: NoticeDirection }) {
  return (
    <StatusPill variant={direction === "RECEIVED" ? "red" : "teal"}>
      {direction === "RECEIVED" ? "↓ Received" : "↑ Sent"}
    </StatusPill>
  );
}

export function RolePill({ role }: { role: Role }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", ROLE_COLORS[role])}>
      {ROLE_LABELS[role]}
    </span>
  );
}
