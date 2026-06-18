"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  PageHeader, Card, Button, EmptyState, LoadingSpinner
} from "@/components/ui/index";
import { Modal } from "@/components/ui/Modal";
import {
  Settings, Plus, Edit2, Trash2, Eye, EyeOff, CheckSquare, Square, Tag, Download
} from "lucide-react";

const MODULES = [
  { value: "matters", label: "Matters", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "hearings", label: "Hearings", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "invoices", label: "Invoices", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "documents", label: "Documents", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "notices", label: "Notices", color: "bg-red-100 text-red-700 border-red-200" },
];

const MODULE_COLORS: Record<string, string> = {
  matters: "bg-blue-100 text-blue-700 border-blue-200",
  hearings: "bg-purple-100 text-purple-700 border-purple-200",
  invoices: "bg-green-100 text-green-700 border-green-200",
  documents: "bg-amber-100 text-amber-700 border-amber-200",
  notices: "bg-red-100 text-red-700 border-red-200",
};

interface OptionItem { value: string; label: string; }
interface FieldConfig {
  id: string;
  module: string;
  fieldKey: string;
  label: string;
  options: OptionItem[] | null;
  isRequired: boolean;
  isVisible: boolean;
  sortOrder: number;
}

function OptionEditor({ options, onChange }: {
  options: OptionItem[];
  onChange: (opts: OptionItem[]) => void;
}) {
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const addOption = () => {
    if (!newValue.trim() || !newLabel.trim()) return;
    onChange([...options, { value: newValue.trim().toUpperCase().replace(/\s+/g, "_"), label: newLabel.trim() }]);
    setNewValue("");
    setNewLabel("");
  };

  const removeOption = (idx: number) => {
    onChange(options.filter((_, i) => i !== idx));
  };

  const inp = "px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200";

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-2">Dropdown Options</label>
      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
            <Tag className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="font-mono text-xs text-slate-500 w-32 truncate">{opt.value}</span>
            <span className="text-xs text-slate-700 flex-1">{opt.label}</span>
            <button
              type="button"
              onClick={() => removeOption(idx)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3">No options yet</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value (e.g. CIVIL)"
          className={`${inp} flex-1`}
        />
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label (e.g. Civil)"
          className={`${inp} flex-1`}
          onKeyDown={(e) => e.key === "Enter" && addOption()}
        />
        <button
          type="button"
          onClick={addOption}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function FieldForm({ defaultValues, onSave, loading, isEdit }: any) {
  const [module, setModule] = useState(defaultValues?.module ?? "matters");
  const [fieldKey, setFieldKey] = useState(defaultValues?.fieldKey ?? "");
  const [label, setLabel] = useState(defaultValues?.label ?? "");
  const [isRequired, setIsRequired] = useState(defaultValues?.isRequired ?? false);
  const [isVisible, setIsVisible] = useState(defaultValues?.isVisible ?? true);
  const [options, setOptions] = useState<OptionItem[]>(defaultValues?.options ?? []);
  const [hasOptions, setHasOptions] = useState(!!(defaultValues?.options?.length));

  const inp = "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldKey.trim() || !label.trim()) {
      toast.error("Field Key and Label are required");
      return;
    }
    onSave({
      module,
      fieldKey: fieldKey.trim().toLowerCase().replace(/\s+/g, "_"),
      label: label.trim(),
      options: hasOptions && options.length > 0 ? options : null,
      isRequired,
      isVisible,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Module *</label>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className={inp}
            disabled={isEdit}
          >
            {MODULES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Field Key *</label>
          <input
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            placeholder="e.g. type, stage, custom_field"
            className={inp}
            disabled={isEdit}
          />
          <p className="text-xs text-slate-400 mt-0.5">Unique identifier, lowercase with underscores</p>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Display Label *</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Case Type, Matter Stage"
            className={inp}
          />
        </div>
      </div>

      {/* Options toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <button type="button" onClick={() => setHasOptions(!hasOptions)}>
            {hasOptions
              ? <CheckSquare className="w-4 h-4 text-red-600" />
              : <Square className="w-4 h-4 text-slate-400" />
            }
          </button>
          <span className="text-xs font-medium text-slate-600">This field has predefined options (dropdown)</span>
        </label>
        {hasOptions && (
          <OptionEditor options={options} onChange={setOptions} />
        )}
      </div>

      {/* Flags */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <button type="button" onClick={() => setIsRequired(!isRequired)}>
            {isRequired
              ? <CheckSquare className="w-4 h-4 text-red-600" />
              : <Square className="w-4 h-4 text-slate-400" />
            }
          </button>
          <span className="text-xs text-slate-600">Required field</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <button type="button" onClick={() => setIsVisible(!isVisible)}>
            {isVisible
              ? <CheckSquare className="w-4 h-4 text-red-600" />
              : <Square className="w-4 h-4 text-slate-400" />
            }
          </button>
          <span className="text-xs text-slate-600">Visible in forms</span>
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" loading={loading}>
          {isEdit ? "Update Field" : "Add Field"}
        </Button>
      </div>
    </form>
  );
}

export default function FieldConfigPage() {
  const qc = useQueryClient();
  const [activeModule, setActiveModule] = useState<string>("matters");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<FieldConfig | null>(null);

  const { data: configs = [], isLoading } = useQuery<FieldConfig[]>({
    queryKey: ["field-configs"],
    queryFn: () => fetch("/api/admin/field-config").then((r) => r.json()),
  });

  const seedDefaults = useMutation({
    mutationFn: () =>
      fetch("/api/admin/field-config/seed", { method: "POST" }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error(res.error); return; }
      qc.invalidateQueries({ queryKey: ["field-configs"] });
      toast.success(res.message);
    },
  });

  const create = useMutation({
    mutationFn: (d: any) =>
      fetch("/api/admin/field-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error(typeof res.error === "string" ? res.error : "Failed"); return; }
      qc.invalidateQueries({ queryKey: ["field-configs"] });
      setModal(null);
      toast.success("Field config added");
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetch(`/api/admin/field-config/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.error) { toast.error("Failed"); return; }
      qc.invalidateQueries({ queryKey: ["field-configs"] });
      setModal(null);
      toast.success("Field updated");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/field-config/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["field-configs"] }); toast.success("Field deleted"); },
  });

  const toggleVisibility = (config: FieldConfig) => {
    update.mutate({ id: config.id, data: { isVisible: !config.isVisible } });
  };

  const moduleConfigs = configs.filter((c) => c.module === activeModule);

  return (
    <div>
      <PageHeader
        title="Field Configuration"
        subtitle="View and manage form fields across all modules — Super Admin only"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => seedDefaults.mutate()}
              loading={seedDefaults.isPending}
            >
              <Download className="w-4 h-4" />
              Load Default Fields
            </Button>
            <Button variant="primary" onClick={() => { setEditing(null); setModal("add"); }}>
              <Plus className="w-4 h-4" />
              Add Field
            </Button>
          </div>
        }
      />

      {/* Module Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {MODULES.map((m) => {
          const count = configs.filter((c) => c.module === m.value).length;
          return (
            <button
              key={m.value}
              onClick={() => setActiveModule(m.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeModule === m.value
                  ? `${MODULE_COLORS[m.value]} shadow-sm`
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {m.label}
              {count > 0 && (
                <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded-full font-semibold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Card>
        {isLoading ? <LoadingSpinner /> : moduleConfigs.length === 0 ? (
          <EmptyState
            icon={<Settings className="w-6 h-6 text-slate-400" />}
            title={`No fields configured for ${activeModule}`}
            description='Click "Load Default Fields" above to populate all existing form fields, then you can edit dropdown options, rename labels, hide fields, or add new ones.'
            action={
              <div className="flex gap-2 justify-center">
                <Button
                  variant="primary"
                  onClick={() => seedDefaults.mutate()}
                  loading={seedDefaults.isPending}
                >
                  <Download className="w-4 h-4" />
                  Load Default Fields
                </Button>
                <Button variant="secondary" onClick={() => { setEditing(null); setModal("add"); }}>
                  <Plus className="w-4 h-4" />
                  Add Custom Field
                </Button>
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F1F3F7" }}>
                  {["Field Key", "Display Label", "Options", "Required", "Visible", "Order", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {moduleConfigs
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((config, i) => (
                    <motion.tr
                      key={config.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-slate-50 transition-colors"
                      style={{ borderBottom: "1px solid #F1F3F7" }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {config.fieldKey}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{config.label}</td>
                      <td className="px-4 py-3">
                        {config.options?.length ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {config.options.slice(0, 3).map((o) => (
                              <span key={o.value} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {o.label}
                              </span>
                            ))}
                            {config.options.length > 3 && (
                              <span className="text-xs text-slate-400">+{config.options.length - 3} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Text input</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          config.isRequired
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {config.isRequired ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleVisibility(config)}
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-all ${
                            config.isVisible
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {config.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {config.isVisible ? "Visible" : "Hidden"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{config.sortOrder}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditing(config); setModal("edit"); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete field "${config.label}"?`)) remove.mutate(config.id); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit Field Configuration" : "Add Field Configuration"}
        size="lg"
      >
        <FieldForm
          isEdit={modal === "edit"}
          loading={create.isPending || update.isPending}
          defaultValues={modal === "edit" && editing ? editing : { module: activeModule }}
          onSave={(d: any) =>
            modal === "edit" && editing
              ? update.mutate({ id: editing.id, data: d })
              : create.mutate(d)
          }
        />
      </Modal>
    </div>
  );
}
