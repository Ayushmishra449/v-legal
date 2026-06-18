"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { userSchema, UserInput } from "@/lib/validations";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { RolePill } from "@/components/ui/StatusPill";
import { PageHeader, Card, Button, EmptyState, LoadingSpinner, ErrorState } from "@/components/ui/index";
import { formatDate, cn } from "@/lib/utils";
import { Plus, Edit2, UserX, UserCheck, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";

const ROLES = ["SUPER_ADMIN","ADMIN","MANAGER","LEGAL_TEAM","FINANCE","VIEWER"];

function UserForm({ defaultValues, onSave, loading, isEdit }: any) {
  const { register, handleSubmit, formState:{errors} } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: { role:"VIEWER", isActive:true, ...defaultValues },
  });
  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";
  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
          <input {...register("name")} className={inp} placeholder="John Doe" />
          {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
          <input {...register("email")} type="email" className={inp} placeholder="user@vikramsolar.com" />
          {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>}
        </div>
        {!isEdit && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password *</label>
            <input {...register("password")} type="password" className={inp} placeholder="Min 6 characters" />
            {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password.message}</p>}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
          <select {...register("role")} className={inp}>{ROLES.map(r=><option key={r} value={r}>{r.replace(/_/g," ")}</option>)}</select>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>{isEdit?"Update":"Create User"}</Button>
      </div>
    </form>
  );
}

export default function AdminPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"add"|"edit"|null>(null);
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then(r=>r.json()),
  });

  const create = useMutation({
    mutationFn:(d:UserInput)=>fetch("/api/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error(typeof res.error==="string"?res.error:"Failed");return;} qc.invalidateQueries({queryKey:["users"]}); setModal(null); toast.success("User created"); },
  });
  const update = useMutation({
    mutationFn:({id,data}:{id:string;data:any})=>fetch(`/api/users/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()),
    onSuccess:(res)=>{ if(res.error){toast.error("Failed");return;} qc.invalidateQueries({queryKey:["users"]}); setModal(null); toast.success("Updated"); },
  });
  const toggleActive = useMutation({
    mutationFn:({id,isActive}:{id:string;isActive:boolean})=>fetch(`/api/users/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({isActive})}).then(r=>r.json()),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:["users"]}); toast.success("Status updated"); },
  });

  const users = Array.isArray(data) ? data : [];

  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="Manage users and roles"
        actions={<Button variant="primary" onClick={()=>{setEditing(null);setModal("add");}}><Plus className="w-4 h-4"/>Add User</Button>}
      />
      <Card>
        {isLoading?<LoadingSpinner/>:error?<ErrorState message="Access denied"/>:users.length===0?(
          <EmptyState icon={<Shield className="w-6 h-6 text-slate-400"/>} title="No users"
            action={<Button variant="primary" onClick={()=>setModal("add")}><Plus className="w-4 h-4"/>Add User</Button>}/>
        ):(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{background:"#FAFAFA",borderBottom:"1px solid #F1F3F7"}}>
                {["Name","Email","Role","Status","Created",""].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.map((u:any,i:number)=>(
                  <motion.tr key={u.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                    className="hover:bg-slate-50" style={{borderBottom:"1px solid #F1F3F7"}}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{background:"#D92228"}}>{u.name?.[0]?.toUpperCase()}</div>
                        <span className="font-medium text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3"><RolePill role={u.role}/></td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",u.isActive?"bg-emerald-50 text-emerald-700 border-emerald-200":"bg-slate-100 text-slate-500 border-slate-200")}>
                        {u.isActive?"Active":"Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={()=>{setEditing(u);setModal("edit");}} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>toggleActive.mutate({id:u.id,isActive:!u.isActive})} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all">
                          {u.isActive?<UserX className="w-3.5 h-3.5"/>:<UserCheck className="w-3.5 h-3.5"/>}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={modal!==null} onClose={()=>setModal(null)} title={modal==="edit"?"Edit User":"Add User"} size="md">
        <UserForm isEdit={modal==="edit"} loading={create.isPending||update.isPending}
          defaultValues={modal==="edit"&&editing?{name:editing.name,email:editing.email,role:editing.role}:undefined}
          onSave={(d:UserInput)=>modal==="edit"&&editing?update.mutate({id:editing.id,data:d}):create.mutate(d)}
        />
      </Modal>
    </div>
  );
}
