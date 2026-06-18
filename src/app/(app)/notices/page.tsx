"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { noticeSchema, NoticeInput } from "@/lib/validations";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { NoticeStatusPill, DirectionPill } from "@/components/ui/StatusPill";
import { PageHeader, Card, Button, EmptyState, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { formatDate, cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, Mail, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const N_STATUSES = ["PENDING_REPLY","REPLIED","SENT","NO_REPLY_REQUIRED"];

function NoticeForm({ defaultValues, onSave, loading, matters }: any) {
  const { register, handleSubmit, formState:{errors} } = useForm<NoticeInput>({
    resolver: zodResolver(noticeSchema),
    defaultValues: { direction:"RECEIVED", status:"PENDING_REPLY", ...defaultValues },
  });
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Direction</label>
          <select {...register("direction")} className={inp}><option value="RECEIVED">Received</option><option value="SENT">Sent</option></select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Counterparty *</label>
          <input {...register("counterparty")} className={inp} placeholder="Sender / Recipient" />
          {errors.counterparty && <p className="text-red-500 text-xs mt-0.5">{errors.counterparty.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notice Date *</label>
          <input type="date" {...register("date")} className={inp} />
          {errors.date && <p className="text-red-500 text-xs mt-0.5">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Reply Due Date</label>
          <input type="date" {...register("replyDue")} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Linked Matter</label>
          <input {...register("matterId")} list="notice-matters" className={inp} placeholder="Matter ID" />
          <datalist id="notice-matters">{matters?.map((m:any)=><option key={m.id} value={m.id}>{m.matterId} — {m.name}</option>)}</datalist>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select {...register("status")} className={inp}>{N_STATUSES.map(o=><option key={o} value={o}>{o.replace(/_/g," ")}</option>)}</select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Subject *</label>
          <input {...register("subject")} className={inp} placeholder="Brief description of notice" />
          {errors.subject && <p className="text-red-500 text-xs mt-0.5">{errors.subject.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notice Doc Link</label>
          <input {...register("noticeLink")} className={inp} placeholder="https://drive.google.com/..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Reply Doc Link</label>
          <input {...register("replyLink")} className={inp} placeholder="https://drive.google.com/..." />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>Save Notice</Button>
      </div>
    </form>
  );
}

export default function NoticesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dirFilter, setDirFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"add"|"edit"|null>(null);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["notices", search, statusFilter, dirFilter, page],
    queryFn: () => fetch(`/api/notices?search=${search}&status=${statusFilter}&direction=${dirFilter}&page=${page}&limit=20`).then(r=>r.json()),
    refetchInterval: 30000,
  });
  const { data: mattersData } = useQuery({ queryKey:["matters-list"], queryFn:()=>fetch("/api/matters?limit=200").then(r=>r.json()) });

  const create = useMutation({
    mutationFn:(d:NoticeInput)=>fetch("/api/notices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed");return;} qc.invalidateQueries({queryKey:["notices"]}); qc.invalidateQueries({queryKey:["dashboard"]}); setModal(null); toast.success("Notice added"); },
  });
  const update = useMutation({
    mutationFn:({id,data}:{id:string;data:NoticeInput})=>fetch(`/api/notices/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed");return;} qc.invalidateQueries({queryKey:["notices"]}); qc.invalidateQueries({queryKey:["dashboard"]}); setModal(null); toast.success("Updated"); },
  });
  const remove = useMutation({
    mutationFn:(id:string)=>fetch(`/api/notices/${id}`,{method:"DELETE"}).then(r=>r.json()),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:["notices"]}); qc.invalidateQueries({queryKey:["dashboard"]}); toast.success("Deleted"); },
  });

  const notices = data?.notices ?? [];

  return (
    <div>
      <PageHeader title="Notices" subtitle={`${data?.total??0} notices`}
        actions={<Button variant="primary" onClick={()=>{setEditing(null);setModal("add");}}><Plus className="w-4 h-4"/>Add Notice</Button>}
      />
      <Card>
        <div className="p-4 flex gap-3 flex-wrap" style={{borderBottom:"1px solid #F1F3F7"}}>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search notices..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200"/>
          </div>
          <select value={dirFilter} onChange={e=>{setDirFilter(e.target.value);setPage(1);}}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50">
            <option value="">All Directions</option><option value="RECEIVED">Received</option><option value="SENT">Sent</option>
          </select>
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50">
            <option value="">All Statuses</option>
            {N_STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
          </select>
        </div>
        {isLoading?<LoadingSpinner/>:error?<ErrorState/>:notices.length===0?(
          <EmptyState icon={<Mail className="w-6 h-6 text-slate-400"/>} title="No notices"
            action={<Button variant="primary" onClick={()=>setModal("add")}><Plus className="w-4 h-4"/>Add</Button>}/>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{background:"#FAFAFA",borderBottom:"1px solid #F1F3F7"}}>
                {["Notice ID","Direction","Counterparty","Subject","Date","Reply Due","Matter","Status","Links",""].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {notices.map((n:any,i:number)=>(
                  <motion.tr key={n.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                    className="hover:bg-slate-50" style={{borderBottom:"1px solid #F1F3F7"}}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{n.noticeId}</td>
                    <td className="px-4 py-3"><DirectionPill direction={n.direction}/></td>
                    <td className="px-4 py-3 text-slate-700 font-medium max-w-[120px] truncate">{n.counterparty}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">{n.subject}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(n.date)}</td>
                    <td className="px-4 py-3 text-amber-600 whitespace-nowrap text-xs">{formatDate(n.replyDue)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{n.matter?.matterId||"—"}</td>
                    <td className="px-4 py-3"><NoticeStatusPill status={n.status}/></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {n.noticeLink&&<a href={n.noticeLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5"><ExternalLink className="w-3 h-3"/>Notice</a>}
                        {n.replyLink&&<a href={n.replyLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 ml-1"><ExternalLink className="w-3 h-3"/>Reply</a>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={()=>{setEditing(n);setModal("edit");}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>{if(confirm("Delete?"))remove.mutate(n.id);}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </td>
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
      <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==="edit"?"Edit Notice":"Add Notice"} size="lg">
        <NoticeForm matters={mattersData?.matters} loading={create.isPending||update.isPending}
          defaultValues={modal==="edit"&&editing?{
            direction:editing.direction,counterparty:editing.counterparty,date:editing.date?format(new Date(editing.date),"yyyy-MM-dd"):"",
            replyDue:editing.replyDue?format(new Date(editing.replyDue),"yyyy-MM-dd"):"",matterId:editing.matter?.id??"",
            status:editing.status,subject:editing.subject,noticeLink:editing.noticeLink??"",replyLink:editing.replyLink??""
          }:undefined}
          onSave={(d:NoticeInput)=>modal==="edit"&&editing?update.mutate({id:editing.id,data:d}):create.mutate(d)}
        />
      </Modal>
    </div>
  );
}
