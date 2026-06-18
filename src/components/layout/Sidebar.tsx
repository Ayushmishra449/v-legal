"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Scale, Calendar, Receipt, FolderOpen, Mail,
  Users, ClipboardList, LogOut, ChevronLeft, ChevronRight, Shield,
  Search, Settings, GitBranch
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/rbac";
import { useState } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", section: "Overview" },
  { href: "/matters", icon: Scale, label: "Matters", section: "Modules" },
  { href: "/hearings", icon: Calendar, label: "Hearings", section: "Modules" },
  { href: "/invoices", icon: Receipt, label: "Invoices", section: "Modules" },
  { href: "/documents", icon: FolderOpen, label: "Documents", section: "Modules" },
  { href: "/notices", icon: Mail, label: "Notices", section: "Modules" },
  { href: "/approvals", icon: ClipboardList, label: "Approvals", section: "Modules" },
  { href: "/court-fetch", icon: Search, label: "Court Fetch", section: "Tools" },
  { href: "/admin", icon: Shield, label: "Admin", section: "Admin" },
  { href: "/admin/audit", icon: ClipboardList, label: "Audit Logs", section: "Admin" },
  { href: "/admin/field-config", icon: Settings, label: "Field Config", section: "Admin" },
  { href: "/admin/workflows", icon: GitBranch, label: "Workflows", section: "Admin" },
];

const SECTIONS = ["Overview", "Modules", "Tools", "Admin"];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="flex flex-col h-screen sticky top-0 flex-shrink-0 overflow-hidden sidebar-scroll"
      style={{ background: "#1A1D2E", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 gap-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-700/50 flex items-center justify-center flex-shrink-0 p-0.5">
          <img src="/vs-logo.png" alt="Logo" width={24} height={24} className="object-contain" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="min-w-0"
            >
              <div className="text-white font-semibold text-sm tracking-tight leading-none">V-Legal</div>
              <div className="text-slate-500 text-xs mt-0.5 leading-none">Vikram Solar</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 sidebar-scroll">
        {SECTIONS.map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section);
          return (
            <div key={section} className="mb-1">
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 pt-3 pb-1"
                  >
                    <span className="text-slate-600 text-xs font-medium uppercase tracking-widest">{section}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {items.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-3 mx-2 px-3 py-2 rounded-lg transition-all duration-150 group relative",
                      active
                        ? "text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    )}
                    style={active ? { background: "rgba(217,34,40,0.15)", color: "#fff" } : {}}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full" style={{ background: "#D92228" }} />
                    )}
                    <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-red-400" : "text-slate-500 group-hover:text-slate-300")} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="text-sm font-medium truncate"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User + Collapse */}
      <div className="flex-shrink-0 p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <AnimatePresence>
          {!collapsed && session?.user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-2 px-2 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "#D92228" }}>
                  {session.user.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-white text-xs font-medium truncate">{session.user.name}</div>
                  <div className="text-slate-500 text-xs truncate">{ROLE_LABELS[session.user.role]}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-1">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs flex-shrink-0"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Sign out</motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
