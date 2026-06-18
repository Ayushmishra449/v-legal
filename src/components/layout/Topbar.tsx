"use client";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useSession } from "next-auth/react";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Overview of your litigation portfolio" },
  "/matters": { title: "Matters", subtitle: "All litigation matters" },
  "/hearings": { title: "Hearings", subtitle: "Hearing records and scheduling" },
  "/invoices": { title: "Invoices", subtitle: "Legal expense tracker" },
  "/documents": { title: "Documents", subtitle: "Document repository" },
  "/notices": { title: "Notices", subtitle: "Sent & received legal notices" },
  "/approvals": { title: "Approvals", subtitle: "Workflow approval management" },
  "/court-fetch": { title: "Court Case Fetch", subtitle: "Search case status from eCourts / NJDG portal" },
  "/admin": { title: "Admin Panel", subtitle: "User and role management" },
  "/admin/audit": { title: "Audit Logs", subtitle: "Full activity trail" },
  "/admin/field-config": { title: "Field Configuration", subtitle: "Manage form fields across modules" },
  "/admin/workflows": { title: "Approval Workflows", subtitle: "Configure multi-step approval pipelines" },
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const meta = Object.entries(PAGE_META).find(([path]) => pathname === path || (path !== "/dashboard" && pathname.startsWith(path)))?.[1]
    ?? { title: "V-Legal", subtitle: "" };

  return (
    <header className="h-16 flex items-center justify-between px-6 flex-shrink-0 bg-white"
      style={{ borderBottom: "1px solid #E8EAF0", position: "sticky", top: 0, zIndex: 30 }}>
      <div>
        <h1 className="font-semibold text-slate-900 text-base">{meta.title}</h1>
        <p className="text-slate-400 text-xs">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            placeholder="Search..."
            className="pl-8 pr-4 py-2 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 w-52 transition-all"
          />
        </div>

        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4 text-slate-500" />
        </button>

        <div className="flex items-center gap-2 pl-3" style={{ borderLeft: "1px solid #E8EAF0" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "#D92228" }}>
            {session?.user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-medium text-slate-700 leading-none">{session?.user?.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">{session?.user?.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
