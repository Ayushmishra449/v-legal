"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hearingSchema, HearingInput } from "@/lib/validations";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { HearingStatusPill } from "@/components/ui/StatusPill";
import { PageHeader, Card, Button, EmptyState, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { formatDate, cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const H_TYPES = ["INITIAL","ARGUMENTS","EVIDENCE","ORDER","MENTION"];
const H_STATUSES = ["SCHEDULED","HEARD","ADJOURNED","ORDER_PASSED"];

function HearingForm({ defaultValues, onSave, loading, matters }: any) {
  const { register, handleSubmit, formState:{errors} } = useForm<HearingInput>({
    resolver: zodResolver(hearingSchema),
    defaultValues: { type:"INITIAL", status:"SCHEDULED", ...defaultValues },
  });
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Matter *</label>
          <input {...register("matterId")} list="matters-list" className={inp} placeholder="Matter ID or name" />
          <datalist id="matters-list">{matters?.map((m:any)=><option key={m.id} value={m.id}>{m.matterId} — {m.name}</option>)}</datalist>
          {errors.matterId && <p className="text-red-500 text-xs mt-0.5">{errors.matterId.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Hearing Date *</label>
          <input type="date" {...register("date")} className={inp} />
          {errors.date && <p className="text-red-500 text-xs mt-0.5">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select {...register("type")} className={inp}>{H_TYPES.map(o=><option key={o} value={o}>{o}</option>)}</select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select {...register("status")} className={inp}>{H_STATUSES.map(o=><option key={o} value={o}>{o.replace(/_/g," ")}</option>)}</select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Next Date</label>
          <input type="date" {...register("nextDate")} className={inp} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Order Doc Link</label>
          <input {...register("docLink")} className={inp} placeholder="https://drive.google.com/..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Updated By</label>
          <input {...register("updatedBy")} className={inp} placeholder="Your name" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Outcome / Summary</label>
          <textarea {...register("outcome")} rows={3} className={cn(inp,"resize-none")} placeholder="What was discussed or ordered..." />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>Save Hearing</Button>
      </div>
    </form>
  );
}

export default function HearingsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"add"|"edit"|null>(null);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["hearings", search, statusFilter, page],
    queryFn: () => fetch(`/api/hearings?search=${search}&status=${statusFilter}&page=${page}&limit=20`).then(r=>r.json()),
    refetchInterval: 30000,
  });

  const { data: mattersData } = useQuery({
    queryKey: ["matters-list"],
    queryFn: () => fetch("/api/matters?limit=200").then(r=>r.json()),
  });

  const create = useMutation({
    mutationFn:(d:HearingInput)=>fetch("/api/hearings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed: "+JSON.stringify(res.error));return;} qc.invalidateQueries({queryKey:["hearings"]}); qc.invalidateQueries({queryKey:["dashboard"]}); setModal(null); toast.success("Hearing added"); },
  });

  const update = useMutation({
    mutationFn:({id,data}:{id:string;data:HearingInput})=>fetch(`/api/hearings/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed");return;} qc.invalidateQueries({queryKey:["hearings"]}); qc.invalidateQueries({queryKey:["dashboard"]}); setModal(null); toast.success("Updated"); },
  });

  const remove = useMutation({
    mutationFn:(id:string)=>fetch(`/api/hearings/${id}`,{method:"DELETE"}).then(r=>r.json()),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:["hearings"]}); qc.invalidateQueries({queryKey:["dashboard"]}); toast.success("Deleted"); },
  });

  const hearings = data?.hearings ?? [];

  return (
    <div>
      <PageHeader title="Hearings" subtitle={`${data?.total??0} hearing records`}
        actions={<Button variant="primary" onClick={()=>{setEditing(null);setModal("add");}}><Plus className="w-4 h-4"/>Add Hearing</Button>}
      />
      <Card>
        <div className="p-4 flex gap-3 flex-wrap" style={{borderBottom:"1px solid #F1F3F7"}}>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search hearings..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200"/>
          </div>
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50">
            <option value="">All Statuses</option>
            {H_STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
          </select>
        </div>
        {isLoading?<LoadingSpinner/>:error?<ErrorState/>:hearings.length===0?(
          <EmptyState icon={<Calendar className="w-6 h-6 text-slate-400"/>} title="No hearings found"
            action={<Button variant="primary" onClick={()=>setModal("add")}><Plus className="w-4 h-4"/>Add Hearing</Button>}/>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{background:"#FAFAFA",borderBottom:"1px solid #F1F3F7"}}>
                {["Hearing ID","Matter","Date","Type","Status","Outcome","Next Date",""].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {hearings.map((h:any,i:number)=>(
                  <motion.tr key={h.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                    className="hover:bg-slate-50 transition-colors" style={{borderBottom:"1px solid #F1F3F7"}}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{h.hearingId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{h.matter?.matterId}</div>
                      <div className="text-slate-400 text-xs truncate max-w-[120px]">{h.matter?.name}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{formatDate(h.date)}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{h.type}</td>
                    <td className="px-4 py-3"><HearingStatusPill status={h.status}/></td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[180px] truncate">{h.outcome||"—"}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{formatDate(h.nextDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={()=>{setEditing(h);setModal("edit");}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>{if(confirm("Delete this hearing?"))remove.mutate(h.id);}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
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
      <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==="edit"?"Edit Hearing":"Add Hearing"} size="lg">
        <HearingForm matters={mattersData?.matters} loading={create.isPending||update.isPending}
          defaultValues={modal==="edit"&&editing?{
            matterId:editing.matter?.id??"",date:editing.date?format(new Date(editing.date),"yyyy-MM-dd"):"",
            type:editing.type,status:editing.status,outcome:editing.outcome??"",
            nextDate:editing.nextDate?format(new Date(editing.nextDate),"yyyy-MM-dd"):"",
            docLink:editing.docLink??"",updatedBy:editing.updatedBy??""
          }:undefined}
          onSave={(d:HearingInput)=>modal==="edit"&&editing?update.mutate({id:editing.id,data:d}):create.mutate(d)}
        />
      </Modal>
    </div>
  );
}
