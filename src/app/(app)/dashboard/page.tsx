"use client";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/ui/KPICard";
import { Card, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { formatCurrency, formatDate, getDaysUntil, cn } from "@/lib/utils";
import {
  Scale, Calendar, Receipt, Mail, AlertTriangle, TrendingUp, BarChart3, PieChart
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#D92228", "#2563EB", "#F5A623", "#10B981", "#7C3AED", "#0D9488"];

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then(r => r.json()),
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  const { kpis, upcomingHearings, urgentHearings, charts } = data ?? {};

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {urgentHearings?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: "rgba(217,34,40,0.06)", border: "1px solid rgba(217,34,40,0.2)" }}
        >
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            ⚠ {urgentHearings.length} hearing(s) within 3 days:{" "}
            {urgentHearings.map((h: any) => h.matter?.matterId).join(", ")}
          </p>
        </motion.div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Active Matters" value={kpis?.activeMatters ?? 0} subtitle={`${kpis?.totalMatters ?? 0} total`} icon={Scale} color="blue" index={0} />
        <KPICard title="Hearings This Week" value={kpis?.hearingsThisWeek ?? 0} subtitle="next 7 days" icon={Calendar} color="red" index={1} />
        <KPICard title="Legal Spend (YTD)" value={formatCurrency(kpis?.ytdSpend)} subtitle="year to date" icon={TrendingUp} color="amber" index={2} />
        <KPICard title="Pending Invoices" value={kpis?.pendingInvoicesCount ?? 0} subtitle={formatCurrency(kpis?.pendingInvoicesAmount) + " outstanding"} icon={Receipt} color="purple" index={3} />
        <KPICard title="Pending Notices" value={kpis?.pendingNotices ?? 0} subtitle="awaiting reply" icon={Mail} color="green" index={4} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Monthly Legal Spend" action={<TrendingUp className="w-4 h-4 text-slate-400" />}>
          <div className="h-56 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.monthlySpend ?? []}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), "Spend"]} contentStyle={{ borderRadius: 8, border: "1px solid #E8EAF0", fontSize: 12 }} />
                <Line type="monotone" dataKey="amount" stroke="#D92228" strokeWidth={2} dot={{ fill: "#D92228", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Upcoming Hearings (14 Days)" action={<Calendar className="w-4 h-4 text-slate-400" />}>
          <div className="px-4 pb-4 space-y-2 max-h-56 overflow-y-auto">
            {(!upcomingHearings || upcomingHearings.length === 0) ? (
              <p className="text-sm text-slate-400 py-8 text-center">No upcoming hearings</p>
            ) : upcomingHearings.map((h: any) => {
              const days = getDaysUntil(h.date);
              const isUrgent = (days ?? 99) <= 3;
              return (
                <div key={h.id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid #F1F3F7" }}>
                  <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: isUrgent ? "rgba(217,34,40,0.08)" : "#F8F9FC" }}>
                    <span className="text-base font-bold leading-none" style={{ color: isUrgent ? "#D92228" : "#1A1D2E" }}>
                      {new Date(h.date).getDate()}
                    </span>
                    <span className="text-xs text-slate-400 uppercase">
                      {new Date(h.date).toLocaleString("en", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{h.matter?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{h.matter?.court}</p>
                  </div>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                    days === 0 ? "bg-red-100 text-red-700" :
                    (days ?? 99) <= 1 ? "bg-red-100 text-red-700" :
                    (days ?? 99) <= 3 ? "bg-amber-100 text-amber-700" :
                    "bg-blue-50 text-blue-600"
                  )}>
                    {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Matters by Status" action={<BarChart3 className="w-4 h-4 text-slate-400" />}>
          <div className="h-48 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.mattersByStatus?.map((m: any) => ({ name: m.status, count: m._count })) ?? []}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E8EAF0", fontSize: 12 }} />
                <Bar dataKey="count" fill="#D92228" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Expense Breakdown" action={<PieChart className="w-4 h-4 text-slate-400" />}>
          <div className="h-48 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={charts?.invoicesByType?.map((i: any, idx: number) => ({
                    name: i.type.replace(/_/g, " "),
                    value: Number(i._sum?.amount ?? 0),
                    fill: COLORS[idx % COLORS.length],
                  })) ?? []}
                  cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                  dataKey="value"
                >
                  {(charts?.invoicesByType ?? []).map((_: any, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [formatCurrency(Number(v))]} contentStyle={{ borderRadius: 8, border: "1px solid #E8EAF0", fontSize: 12 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top Matters by Spend" action={<BarChart3 className="w-4 h-4 text-slate-400" />}>
          <div className="h-48 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.topMattersSpend ?? []} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), "Spend"]} contentStyle={{ borderRadius: 8, border: "1px solid #E8EAF0", fontSize: 12 }} />
                <Bar dataKey="amount" fill="#F5A623" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
