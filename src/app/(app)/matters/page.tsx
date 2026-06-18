"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { matterSchema, MatterInput } from "@/lib/validations";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { MatterStatusPill } from "@/components/ui/StatusPill";
import { PageHeader, Card, Button, EmptyState, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { formatDate, isUrgent, cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, Scale, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const MATTER_TYPES = ["CIVIL","ARBITRATION","REGULATORY","WRIT_ADMINISTRATIVE","CRIMINAL","LABOUR","LAND_ACQUISITION","CONTRACT_DISPUTE"];
const MATTER_STAGES = ["PRE_FILING","PLEADINGS","EVIDENCE","ARGUMENTS","RESERVED","ORDER_RECEIVED","EXECUTION"];
const MATTER_STATUSES = ["ONGOING","SETTLED","CLOSED","DISMISSED","STAY_GRANTED"];

function MatterForm({ defaultValues, onSave, loading }: { defaultValues?: Partial<MatterInput>; onSave:(d:MatterInput)=>void; loading:boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<MatterInput>({
    resolver: zodResolver(matterSchema),
    defaultValues: { status:"ONGOING", type:"CIVIL", stage:"PRE_FILING", ...defaultValues },
  });
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">Matter Name *</label>
          <input {...register("name")} className={inp} placeholder="e.g. RVPN vs Vikram Solar" />
          {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Opposite Party *</label>
          <input {...register("oppositeParty")} className={inp} placeholder="Full legal name" />
          {errors.oppositeParty && <p className="text-red-500 text-xs mt-0.5">{errors.oppositeParty.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Court / Tribunal *</label>
          <input {...register("court")} className={inp} placeholder="e.g. Delhi High Court" />
          {errors.court && <p className="text-red-500 text-xs mt-0.5">{errors.court.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Case Number</label>
          <input {...register("caseNumber")} className={inp} placeholder="Court-assigned number" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select {...register("type")} className={inp}>
            {MATTER_TYPES.map(o => <option key={o} value={o}>{o.replace(/_/g," ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
          <select {...register("stage")} className={inp}>
            {MATTER_STAGES.map(o => <option key={o} value={o}>{o.replace(/_/g," ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Next Hearing</label>
          <input type="date" {...register("nextHearing")} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Limitation Date</label>
          <input type="date" {...register("limitationDate")} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Counsel</label>
          <input {...register("counsel")} className={inp} placeholder="Law firm or advocate" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Internal Owner</label>
          <input {...register("internalOwner")} className={inp} placeholder="Team member" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Financial Exposure (₹)</label>
          <input {...register("exposure")} className={inp} placeholder="e.g. 5000000" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select {...register("status")} className={inp}>
            {MATTER_STATUSES.map(o => <option key={o} value={o}>{o.replace(/_/g," ")}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
        <textarea {...register("remarks")} rows={3} className={cn(inp,"resize-none")} placeholder="Latest order, case notes..." />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>Save Matter</Button>
      </div>
    </form>
  );
}

export default function MattersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"add"|"edit"|null>(null);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["matters", search, statusFilter, page],
    queryFn: () => fetch(`/api/matters?search=${search}&status=${statusFilter}&page=${page}&limit=20`).then(r=>r.json()),
    refetchInterval: 30000,
  });

  const create = useMutation({
    mutationFn: (d:MatterInput) => fetch("/api/matters",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed");return;} qc.invalidateQueries({queryKey:["matters"]}); qc.invalidateQueries({queryKey:["dashboard"]}); setModal(null); toast.success("Matter created"); },
  });

  const update = useMutation({
    mutationFn: ({id,data}:{id:string;data:MatterInput}) => fetch(`/api/matters/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed");return;} qc.invalidateQueries({queryKey:["matters"]}); qc.invalidateQueries({queryKey:["dashboard"]}); setModal(null); toast.success("Matter updated"); },
  });

  const remove = useMutation({
    mutationFn:(id:string)=>fetch(`/api/matters/${id}`,{method:"DELETE"}).then(r=>r.json()),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:["matters"]}); qc.invalidateQueries({queryKey:["dashboard"]}); toast.success("Deleted"); },
  });

  const matters = data?.matters ?? [];

  return (
    <div>
      <PageHeader title="Matters" subtitle={`${data?.total??0} total matters`}
        actions={<Button variant="primary" onClick={()=>{setEditing(null);setModal("add");}}><Plus className="w-4 h-4"/>Add Matter</Button>}
      />
      <Card>
        <div className="p-4 flex gap-3 flex-wrap" style={{borderBottom:"1px solid #F1F3F7"}}>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search matters..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200"/>
          </div>
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50">
            <option value="">All Statuses</option>
            {MATTER_STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
          </select>
        </div>
        {isLoading?<LoadingSpinner/>:error?<ErrorState/>:matters.length===0?(
          <EmptyState icon={<Scale className="w-6 h-6 text-slate-400"/>} title="No matters found"
            description="Add your first legal matter." action={<Button variant="primary" onClick={()=>setModal("add")}><Plus className="w-4 h-4"/>Add Matter</Button>}/>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{background:"#FAFAFA",borderBottom:"1px solid #F1F3F7"}}>
                  {["Matter ID","Name","Opposite Party","Court","Stage","Next Hearing","Counsel","Status",""].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matters.map((m:any,i:number)=>{
                  const urgent=isUrgent(m.nextHearing);
                  return (
                    <motion.tr key={m.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                      className="hover:bg-slate-50 transition-colors" style={{borderBottom:"1px solid #F1F3F7"}}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.matterId}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-[180px] truncate">{m.name}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{m.oppositeParty}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">{m.court}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{m.stage?.replace(/_/g," ")}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("text-xs",urgent?"text-red-600 font-semibold":"text-slate-600")}>
                          {urgent&&<AlertCircle className="w-3 h-3 inline mr-1"/>}{formatDate(m.nextHearing)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-[120px] truncate">{m.counsel||"—"}</td>
                      <td className="px-4 py-3"><MatterStatusPill status={m.status}/></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={()=>{setEditing(m);setModal("edit");}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                          <button onClick={()=>{if(confirm(`Delete "${m.name}"?`))remove.mutate(m.id);}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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
      <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==="edit"?"Edit Matter":"Add Matter"} size="lg">
        <MatterForm loading={create.isPending||update.isPending}
          defaultValues={modal==="edit"&&editing?{
            name:editing.name,oppositeParty:editing.oppositeParty,court:editing.court,caseNumber:editing.caseNumber??"",
            type:editing.type,stage:editing.stage,
            nextHearing:editing.nextHearing?format(new Date(editing.nextHearing),"yyyy-MM-dd"):"",
            limitationDate:editing.limitationDate?format(new Date(editing.limitationDate),"yyyy-MM-dd"):"",
            counsel:editing.counsel??"",internalOwner:editing.internalOwner??"",
            exposure:editing.exposure?String(editing.exposure):"",status:editing.status,remarks:editing.remarks??""
          }:undefined}
          onSave={d=>modal==="edit"&&editing?update.mutate({id:editing.id,data:d}):create.mutate(d)}
        />
      </Modal>
    </div>
  );
}
