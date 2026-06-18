import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "red" | "blue" | "amber" | "green" | "purple";
  index?: number;
}

const COLOR_MAP = {
  red: { bg: "bg-red-50", icon: "text-red-600", accent: "#D92228", bar: "bg-red-500" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600", accent: "#2563EB", bar: "bg-blue-500" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", accent: "#F5A623", bar: "bg-amber-500" },
  green: { bg: "bg-emerald-50", icon: "text-emerald-600", accent: "#10B981", bar: "bg-emerald-500" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", accent: "#7C3AED", bar: "bg-purple-500" },
};

export function KPICard({ title, value, subtitle, icon: Icon, color = "blue", index = 0 }: KPICardProps) {
  const c = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="bg-white rounded-xl p-5 relative overflow-hidden"
      style={{ border: "1px solid #E8EAF0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${c.bar}`} />
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </motion.div>
  );
}
