"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, Card, Button, EmptyState, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDateTime } from "@/lib/utils";
import { ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

const ACTION_STYLES = {
  CREATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
};

export default function AuditPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["audit", page],
    queryFn: () => fetch(`/api/audit?page=${page}&limit=50`).then(r=>r.json()),
  });

  const logs = data?.logs ?? [];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle={`${data?.total??0} total actions recorded`} />
      <Card>
        {isLoading?<LoadingSpinner/>:error?<ErrorState message="Access denied or error loading audit logs"/>:logs.length===0?(
          <EmptyState icon={<ClipboardList className="w-6 h-6 text-slate-400"/>} title="No audit logs yet" description="Actions will appear here as users create, update, or delete records."/>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{background:"#FAFAFA",borderBottom:"1px solid #F1F3F7"}}>
                {["Time","Action","Table","Record ID","User","Role"].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {logs.map((log:any,i:number)=>(
                  <motion.tr key={log.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.01}}
                    className="hover:bg-slate-50" style={{borderBottom:"1px solid #F1F3F7"}}>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_STYLES[log.action as keyof typeof ACTION_STYLES]}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{log.table}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{log.recordId.slice(0,12)}...</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{log.user?.name}</div>
                      <div className="text-slate-400 text-xs">{log.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{log.user?.role?.replace(/_/g," ")}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data&&data.pages>1&&(
          <div className="flex items-center justify-between px-4 py-3" style={{borderTop:"1px solid #F1F3F7"}}>
            <p className="text-xs text-slate-500">Page {page} of {data.pages}</p>
            <div className="flex gap-1">
              <Button size="sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</Button>
              <Button size="sm" onClick={()=>setPage(p=>Math.min(data.pages,p+1))} disabled={page===data.pages}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
