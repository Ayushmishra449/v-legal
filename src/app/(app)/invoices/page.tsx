"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, InvoiceInput } from "@/lib/validations";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { PaymentStatusPill } from "@/components/ui/StatusPill";
import { PageHeader, Card, Button, EmptyState, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { formatDate, formatCurrencyFull, cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, Receipt } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const INV_TYPES = ["COUNSEL_FEES","ARBITRATOR_FEES","MISC"];
const PAY_STATUSES = ["PENDING","PAID","REJECTED"];
const PENDING_STAGES = ["PR_INDENT_CREATION","PO_CREATION","PO_RELEASE","SRN_CREATION","ACCOUNTS_PROCESSING","MANAGEMENT_APPROVAL","PAYMENT_RELEASED"];

function InvoiceForm({ defaultValues, onSave, loading, matters }: any) {
  const { register, handleSubmit, watch, formState:{errors} } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { type:"COUNSEL_FEES", paymentStatus:"PENDING", ...defaultValues },
  });
  const payStatus = watch("paymentStatus");
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Vendor *</label>
          <input {...register("vendor")} className={inp} placeholder="Law firm or arbitrator" />
          {errors.vendor && <p className="text-red-500 text-xs mt-0.5">{errors.vendor.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Bill No.</label>
          <input {...register("billNo")} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
          <input type="date" {...register("date")} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Amount (₹) *</label>
          <input {...register("amount")} className={inp} placeholder="150000" />
          {errors.amount && <p className="text-red-500 text-xs mt-0.5">{errors.amount.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Linked Matter</label>
          <input {...register("matterId")} list="inv-matters" className={inp} placeholder="Matter ID" />
          <datalist id="inv-matters">{matters?.map((m:any)=><option key={m.id} value={m.id}>{m.matterId} — {m.name}</option>)}</datalist>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select {...register("type")} className={inp}>{INV_TYPES.map(o=><option key={o} value={o}>{o.replace(/_/g," ")}</option>)}</select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Payment Status</label>
          <select {...register("paymentStatus")} className={inp}>{PAY_STATUSES.map(o=><option key={o} value={o}>{o}</option>)}</select>
        </div>
        {payStatus !== "PAID" && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Pending At Stage</label>
            <select {...register("pendingAt")} className={inp}>
              <option value="">— Select —</option>
              {PENDING_STAGES.map(o=><option key={o} value={o}>{o.replace(/_/g," ")}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Payment Date</label>
          <input type="date" {...register("paymentDate")} className={inp} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
          <textarea {...register("remarks")} rows={2} className={cn(inp,"resize-none")} placeholder="Notes..." />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>Save Invoice</Button>
      </div>
    </form>
  );
}

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"add"|"edit"|null>(null);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoices", search, statusFilter, page],
    queryFn: () => fetch(`/api/invoices?search=${search}&status=${statusFilter}&page=${page}&limit=20`).then(r=>r.json()),
    refetchInterval: 30000,
  });
  const { data: mattersData } = useQuery({ queryKey:["matters-list"], queryFn:()=>fetch("/api/matters?limit=200").then(r=>r.json()) });

  const create = useMutation({
    mutationFn:(d:InvoiceInput)=>fetch("/api/invoices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed");return;} qc.invalidateQueries({queryKey:["invoices"]}); qc.invalidateQueries({queryKey:["dashboard"]}); setModal(null); toast.success("Invoice added"); },
  });
  const update = useMutation({
    mutationFn:({id,data}:{id:string;data:InvoiceInput})=>fetch(`/api/invoices/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed");return;} qc.invalidateQueries({queryKey:["invoices"]}); qc.invalidateQueries({queryKey:["dashboard"]}); setModal(null); toast.success("Updated"); },
  });
  const remove = useMutation({
    mutationFn:(id:string)=>fetch(`/api/invoices/${id}`,{method:"DELETE"}).then(r=>r.json()),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:["invoices"]}); qc.invalidateQueries({queryKey:["dashboard"]}); toast.success("Deleted"); },
  });

  const invoices = data?.invoices ?? [];

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`${data?.total??0} invoices`}
        actions={<Button variant="primary" onClick={()=>{setEditing(null);setModal("add");}}><Plus className="w-4 h-4"/>Add Invoice</Button>}
      />
      <Card>
        <div className="p-4 flex gap-3 flex-wrap" style={{borderBottom:"1px solid #F1F3F7"}}>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search vendor, bill..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200"/>
          </div>
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50">
            <option value="">All</option>{PAY_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {isLoading?<LoadingSpinner/>:error?<ErrorState/>:invoices.length===0?(
          <EmptyState icon={<Receipt className="w-6 h-6 text-slate-400"/>} title="No invoices"
            action={<Button variant="primary" onClick={()=>setModal("add")}><Plus className="w-4 h-4"/>Add</Button>}/>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{background:"#FAFAFA",borderBottom:"1px solid #F1F3F7"}}>
                {["#","Vendor","Bill","Date","Amount","Matter","Type","Status","Pending At",""].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {invoices.map((inv:any,i:number)=>(
                  <motion.tr key={inv.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                    className="hover:bg-slate-50" style={{borderBottom:"1px solid #F1F3F7"}}>
                    <td className="px-4 py-3 text-xs text-slate-400">{i+1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[140px] truncate">{inv.vendor}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.billNo||"—"}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrencyFull(inv.amount)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.matter?.matterId||"—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{inv.type?.replace(/_/g," ")}</td>
                    <td className="px-4 py-3"><PaymentStatusPill status={inv.paymentStatus}/></td>
                    <td className="px-4 py-3 text-amber-600 text-xs max-w-[120px] truncate">{inv.pendingAt?.replace(/_/g," ")||"—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={()=>{setEditing(inv);setModal("edit");}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>{if(confirm("Delete?"))remove.mutate(inv.id);}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
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
      <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==="edit"?"Edit Invoice":"Add Invoice"} size="lg">
        <InvoiceForm matters={mattersData?.matters} loading={create.isPending||update.isPending}
          defaultValues={modal==="edit"&&editing?{
            vendor:editing.vendor,billNo:editing.billNo??"",date:editing.date?format(new Date(editing.date),"yyyy-MM-dd"):"",
            amount:String(editing.amount),matterId:editing.matter?.id??"",type:editing.type,
            paymentStatus:editing.paymentStatus,pendingAt:editing.pendingAt??"",
            paymentDate:editing.paymentDate?format(new Date(editing.paymentDate),"yyyy-MM-dd"):"",remarks:editing.remarks??""
          }:undefined}
          onSave={(d:InvoiceInput)=>modal==="edit"&&editing?update.mutate({id:editing.id,data:d}):create.mutate(d)}
        />
      </Modal>
    </div>
  );
}
