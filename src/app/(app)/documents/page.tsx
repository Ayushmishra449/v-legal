"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { documentSchema, DocumentInput } from "@/lib/validations";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { PageHeader, Card, Button, EmptyState, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { formatDate, cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, FolderOpen, ExternalLink, Send, CheckCircle2, XCircle, Clock, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

const DOC_TYPES = ["PETITION_PLAINT","COURT_ORDER","EVIDENCE","LEGAL_NOTICE","CONTRACT","CORRESPONDENCE","OTHER"];

function DocumentForm({ defaultValues, onSave, loading, matters }: any) {
  const { register, handleSubmit, formState:{errors} } = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: { type:"OTHER", ...defaultValues },
  });
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Document Name *</label>
          <input {...register("name")} className={inp} placeholder="e.g. Writ Petition v2" />
          {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
          <select {...register("type")} className={inp}>{DOC_TYPES.map(o=><option key={o} value={o}>{o.replace(/_/g," ")}</option>)}</select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Linked Matter</label>
          <input {...register("matterId")} list="doc-matters" className={inp} placeholder="Matter ID" />
          <datalist id="doc-matters">{matters?.map((m:any)=><option key={m.id} value={m.id}>{m.matterId} — {m.name}</option>)}</datalist>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
          <input type="date" {...register("date")} className={inp} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Uploaded By</label>
          <input {...register("uploadedBy")} className={inp} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Version</label>
          <input {...register("version")} className={inp} placeholder="v1.0" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Google Drive Link</label>
          <input {...register("fileLink")} className={inp} placeholder="https://drive.google.com/..." />
          {errors.fileLink && <p className="text-red-500 text-xs mt-0.5">{errors.fileLink.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
          <input {...register("remarks")} className={inp} placeholder="Notes..." />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>Save Document</Button>
      </div>
    </form>
  );
}

// Approval request form
function ApprovalForm({ document, onClose }: { document: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [approverEmail, setApproverEmail] = useState("");
  const [comments, setComments] = useState("");
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";

  const sendApproval = useMutation({
    mutationFn: (data: any) =>
      fetch(`/api/documents/${document.id}/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(typeof res.error === "string" ? res.error : "An approval is already pending");
        return;
      }
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success(`Approval request sent to ${approverEmail}`);
      onClose();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
        <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-slate-800">{document.name}</p>
          <p className="text-xs text-slate-500">{document.docId} • {document.type?.replace(/_/g, " ")}</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Approver Email *</label>
        <input
          value={approverEmail}
          onChange={(e) => setApproverEmail(e.target.value)}
          type="email"
          className={inp}
          placeholder="senior@vikramsolar.com"
        />
        <p className="text-xs text-slate-400 mt-1">The approver will be identified by their email address in V-Legal</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Comments (optional)</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          className={cn(inp, "resize-none")}
          placeholder="What needs to be reviewed..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          loading={sendApproval.isPending}
          onClick={() => {
            if (!approverEmail) { toast.error("Approver email is required"); return; }
            sendApproval.mutate({ approverEmail, comments });
          }}
        >
          <Send className="w-3.5 h-3.5" />
          Send for Approval
        </Button>
      </div>
    </div>
  );
}

// Approval status badge
function ApprovalBadge({ documentId }: { documentId: string }) {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [showApprovals, setShowApprovals] = useState(false);

  const { data: approvals = [] } = useQuery({
    queryKey: ["approvals", documentId],
    queryFn: () => fetch(`/api/documents/${documentId}/approvals`).then((r) => r.json()),
  });

  const actionApproval = useMutation({
    mutationFn: ({ approvalId, action, comments }: any) =>
      fetch(`/api/documents/${documentId}/approvals/${approvalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comments }),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return; }
      qc.invalidateQueries({ queryKey: ["approvals", documentId] });
      toast.success(`Document ${res.status.toLowerCase()}`);
    },
  });

  const pending = approvals.filter((a: any) => a.status === "PENDING");
  const latest = approvals[0];

  if (!approvals.length) return null;

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    PENDING: { icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200", label: "Pending" },
    APPROVED: { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Approved" },
    REJECTED: { icon: XCircle, color: "text-red-600 bg-red-50 border-red-200", label: "Rejected" },
  };

  const cfg = statusConfig[latest?.status] ?? statusConfig.PENDING;
  const Icon = cfg.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setShowApprovals(!showApprovals)}
        className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color} transition-all`}
      >
        <Icon className="w-3 h-3" />
        {cfg.label}
        <ChevronDown className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {showApprovals && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-7 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-700">Approval History</p>
            </div>
            {approvals.map((a: any) => {
              const acfg = statusConfig[a.status];
              const AIcon = acfg.icon;
              const isApprover = session?.user?.email === a.approverEmail;
              return (
                <div key={a.id} className="p-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full border ${acfg.color}`}>
                          <AIcon className="w-2.5 h-2.5" />
                          {acfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        To: <span className="font-medium">{a.approverEmail}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        By: {a.requestedBy?.name} • {new Date(a.createdAt).toLocaleDateString("en-IN")}
                      </p>
                      {a.comments && <p className="text-xs text-slate-500 mt-1 italic">"{a.comments}"</p>}
                    </div>
                  </div>
                  {isApprover && a.status === "PENDING" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => actionApproval.mutate({ approvalId: a.id, action: "APPROVED" })}
                        className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => actionApproval.mutate({ approvalId: a.id, action: "REJECTED" })}
                        className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<"add"|"edit"|"approval"|null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [approvalDoc, setApprovalDoc] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["documents", search, page],
    queryFn: () => fetch(`/api/documents?search=${search}&page=${page}&limit=20`).then(r=>r.json()),
    refetchInterval: 30000,
  });
  const { data: mattersData } = useQuery({ queryKey:["matters-list"], queryFn:()=>fetch("/api/matters?limit=200").then(r=>r.json()) });

  const create = useMutation({
    mutationFn:(d:DocumentInput)=>fetch("/api/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed");return;} qc.invalidateQueries({queryKey:["documents"]}); setModal(null); toast.success("Document added"); },
  });
  const update = useMutation({
    mutationFn:({id,data}:{id:string;data:DocumentInput})=>fetch(`/api/documents/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed");return;} qc.invalidateQueries({queryKey:["documents"]}); setModal(null); toast.success("Updated"); },
  });
  const remove = useMutation({
    mutationFn:(id:string)=>fetch(`/api/documents/${id}`,{method:"DELETE"}).then(r=>r.json()),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:["documents"]}); toast.success("Deleted"); },
  });

  const documents = data?.documents ?? [];

  return (
    <div>
      <PageHeader title="Documents" subtitle={`${data?.total??0} documents`}
        actions={<Button variant="primary" onClick={()=>{setEditing(null);setModal("add");}}><Plus className="w-4 h-4"/>Add Document</Button>}
      />
      <Card>
        <div className="p-4 flex gap-3" style={{borderBottom:"1px solid #F1F3F7"}}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search documents..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200"/>
          </div>
        </div>
        {isLoading?<LoadingSpinner/>:error?<ErrorState/>:documents.length===0?(
          <EmptyState icon={<FolderOpen className="w-6 h-6 text-slate-400"/>} title="No documents"
            action={<Button variant="primary" onClick={()=>setModal("add")}><Plus className="w-4 h-4"/>Add</Button>}/>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{background:"#FAFAFA",borderBottom:"1px solid #F1F3F7"}}>
                {["Doc ID","Name","Type","Matter","Date","Uploaded By","Link","Approval",""].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {documents.map((d:any,i:number)=>(
                  <motion.tr key={d.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                    className="hover:bg-slate-50" style={{borderBottom:"1px solid #F1F3F7"}}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.docId}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[160px] truncate">{d.name}</td>
                    <td className="px-4 py-3"><StatusPill variant="purple">{d.type?.replace(/_/g," ")}</StatusPill></td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.matter?.matterId||"—"}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(d.date)}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{d.uploadedBy||"—"}</td>
                    <td className="px-4 py-3">
                      {d.fileLink?<a href={d.fileLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"><ExternalLink className="w-3 h-3"/>Open</a>:"—"}
                    </td>
                    <td className="px-4 py-3">
                      <ApprovalBadge documentId={d.id} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={()=>{setEditing(d);setModal("edit");}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                        <button
                          onClick={() => { setApprovalDoc(d); setModal("approval"); }}
                          title="Send for approval"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                        >
                          <Send className="w-3.5 h-3.5"/>
                        </button>
                        <button onClick={()=>{if(confirm("Delete?"))remove.mutate(d.id);}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
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

      {/* Add/Edit Modal */}
      <Modal open={modal==="add"||modal==="edit"} onClose={()=>setModal(null)} title={modal==="edit"?"Edit Document":"Add Document"} size="lg">
        <DocumentForm matters={mattersData?.matters} loading={create.isPending||update.isPending}
          defaultValues={modal==="edit"&&editing?{
            name:editing.name,type:editing.type,matterId:editing.matter?.id??"",
            date:editing.date?format(new Date(editing.date),"yyyy-MM-dd"):"",
            uploadedBy:editing.uploadedBy??"",version:editing.version??"",fileLink:editing.fileLink??"",remarks:editing.remarks??""
          }:undefined}
          onSave={(d:DocumentInput)=>modal==="edit"&&editing?update.mutate({id:editing.id,data:d}):create.mutate(d)}
        />
      </Modal>

      {/* Approval Modal */}
      <Modal open={modal==="approval"} onClose={()=>setModal(null)} title="Send for Approval" size="md">
        {approvalDoc && <ApprovalForm document={approvalDoc} onClose={()=>setModal(null)} />}
      </Modal>
    </div>
  );
}
