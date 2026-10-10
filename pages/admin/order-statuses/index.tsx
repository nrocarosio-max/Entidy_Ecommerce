"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaTimes, FaSyncAlt } from "react-icons/fa";

type OrderStatusItem = {
 _id: string;
 name: string;
 code: string;
 description?: string;
 color?: string;
 icon?: string;
 sortOrder: number;
 isActive: boolean;
 isInitial: boolean;
 isFinal: boolean;
 nextStatusIds: Array<string | { _id: string }>;
 createdAt?: string;
 updatedAt?: string;
};

type StatusForm = {
 name: string;
 code: string;
 description: string;
 color: string;
 icon: string;
 sortOrder: number;
 isActive: boolean;
 isInitial: boolean;
 isFinal: boolean;
 nextStatusIds: string[];
};

const EMPTY_FORM: StatusForm = {
 name: "",
 code: "",
 description: "",
 color: "#6B7280",
 icon: "",
 sortOrder: 0,
 isActive: true,
 isInitial: false,
 isFinal: false,
 nextStatusIds: [],
};

const API_URL = "/api/admin/order-statuses";

function getStatusIds(status: OrderStatusItem): string[] {
 return (status.nextStatusIds || []).map((item) => (typeof item === "string" ? item : item._id));
}

function getErrorMessage(data: unknown, fallback: string): string {
 if (data && typeof data === "object" && "message" in data) {
  const message = (data as { message?: unknown }).message;
  if (typeof message === "string" && message) return message;
 }

 if (data && typeof data === "object" && "error" in data) {
  const error = (data as { error?: unknown }).error;
  if (typeof error === "string" && error) return error;
 }

 return fallback;
}

function getStatusList(data: unknown): OrderStatusItem[] {
 if (Array.isArray(data)) return data as OrderStatusItem[];

 if (data && typeof data === "object") {
  const result = data as {
   statuses?: unknown;
   data?: unknown;
   results?: unknown;
  };

  if (Array.isArray(result.statuses)) {
   return result.statuses as OrderStatusItem[];
  }

  if (Array.isArray(result.data)) {
   return result.data as OrderStatusItem[];
  }

  if (Array.isArray(result.results)) {
   return result.results as OrderStatusItem[];
  }
 }

 return [];
}

export default function OrderStatuses() {
 const [statuses, setStatuses] = useState<OrderStatusItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [search, setSearch] = useState("");
 const [filter, setFilter] = useState("ALL");
 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");
 const [modalOpen, setModalOpen] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);
 const [form, setForm] = useState<StatusForm>(EMPTY_FORM);

 const loadStatuses = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
   const response = await fetch(API_URL);
   const data: unknown = await response.json();

   if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to load order statuses."));
   }

   setStatuses(getStatusList(data));
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to load order statuses.");
  } finally {
   setLoading(false);
  }
 }, []);

 useEffect(() => {
  void loadStatuses();
 }, [loadStatuses]);

 const filteredStatuses = useMemo(() => {
  const keyword = search.trim().toLowerCase();

  return statuses
   .filter((status) => {
    const matchesSearch =
     !keyword ||
     status.name.toLowerCase().includes(keyword) ||
     status.code.toLowerCase().includes(keyword) ||
     (status.description || "").toLowerCase().includes(keyword);

    const matchesFilter =
     filter === "ALL" ||
     (filter === "ACTIVE" && status.isActive) ||
     (filter === "INACTIVE" && !status.isActive) ||
     (filter === "INITIAL" && status.isInitial) ||
     (filter === "FINAL" && status.isFinal);

    return matchesSearch && matchesFilter;
   })
   .sort((a, b) => a.sortOrder - b.sortOrder);
 }, [statuses, search, filter]);

 function openCreateModal() {
  setEditingId(null);
  setForm({
   ...EMPTY_FORM,
   sortOrder: statuses.length > 0 ? Math.max(...statuses.map((status) => status.sortOrder || 0)) + 1 : 0,
  });
  setError("");
  setModalOpen(true);
 }

 function openEditModal(status: OrderStatusItem) {
  setEditingId(status._id);
  setForm({
   name: status.name,
   code: status.code,
   description: status.description || "",
   color: status.color || "#6B7280",
   icon: status.icon || "",
   sortOrder: status.sortOrder || 0,
   isActive: status.isActive,
   isInitial: status.isInitial,
   isFinal: status.isFinal,
   nextStatusIds: getStatusIds(status),
  });
  setError("");
  setModalOpen(true);
 }

 function closeModal() {
  if (saving) return;
  setModalOpen(false);
  setEditingId(null);
  setForm(EMPTY_FORM);
 }

 function updateForm<K extends keyof StatusForm>(key: K, value: StatusForm[K]) {
  setForm((previous) => ({ ...previous, [key]: value }));
 }

 function toggleNextStatus(id: string) {
  setForm((previous) => ({
   ...previous,
   nextStatusIds: previous.nextStatusIds.includes(id) ? previous.nextStatusIds.filter((item) => item !== id) : [...previous.nextStatusIds, id],
  }));
 }

 async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setError("");
  setSuccess("");

  if (!form.name.trim() || !form.code.trim()) {
   setError("Status name and code are required.");
   return;
  }

  if (form.isInitial && !form.isActive) {
   setError("The initial status must be active.");
   return;
  }

  setSaving(true);

  try {
   const payload = {
    name: form.name.trim(),
    code: form.code.trim().toUpperCase().replace(/\s+/g, "_"),
    description: form.description.trim(),
    color: form.color,
    icon: form.icon.trim(),
    sortOrder: Number(form.sortOrder),
    isActive: form.isActive,
    isInitial: form.isInitial,
    isFinal: form.isFinal,
    nextStatusIds: form.nextStatusIds,
   };

   const response = await fetch(editingId ? `${API_URL}/${editingId}` : API_URL, {
    method: editingId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
   });

   const data: unknown = await response.json();

   if (!response.ok) {
    throw new Error(getErrorMessage(data, "Unable to save the order status."));
   }

   setModalOpen(false);
   setEditingId(null);
   setForm(EMPTY_FORM);
   setSuccess(editingId ? "Status updated successfully." : "Status created successfully.");
   await loadStatuses();
  } catch (err) {
   setError(err instanceof Error ? err.message : "Unable to save the order status.");
  } finally {
   setSaving(false);
  }
 }

 async function handleDelete(status: OrderStatusItem) {
  const confirmed = window.confirm(
   `Delete "${status.name}" (${status.code})?\n\nThe API may reject deletion if this status is the initial status, is used by an order, or is referenced by another status.`,
  );

  if (!confirmed) return;

  setError("");
  setSuccess("");

  try {
   const response = await fetch(`${API_URL}/${status._id}`, {
    method: "DELETE",
   });
   const data: unknown = await response.json();

   if (!response.ok) {
    throw new Error(getErrorMessage(data, "Unable to delete the order status."));
   }

   setSuccess("Status deleted successfully.");
   await loadStatuses();
  } catch (err) {
   setError(err instanceof Error ? err.message : "Unable to delete the order status.");
  }
 }

 const activeCount = statuses.filter((status) => status.isActive).length;
 const initialCount = statuses.filter((status) => status.isInitial).length;
 const finalCount = statuses.filter((status) => status.isFinal).length;

 return (
  <div className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-6 lg:p-8">
   <div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
     <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Order Status Management</h1>
      <p className="mt-2 text-sm text-gray-500">Manage the global order workflow for all stores.</p>
     </div>

     <div className="flex gap-2">
      <button
       type="button"
       onClick={() => void loadStatuses()}
       disabled={loading}
       className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50">
       <FaSyncAlt className={loading ? "animate-spin" : ""} />
       Refresh
      </button>

      <button
       type="button"
       onClick={openCreateModal}
       className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700">
       <FaPlus />
       Add Status
      </button>
     </div>
    </div>

    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
     <SummaryCard label="Total Statuses" value={statuses.length} />
     <SummaryCard label="Active" value={activeCount} />
     <SummaryCard label="Initial Statuses" value={initialCount} />
     <SummaryCard label="Final Statuses" value={finalCount} />
    </div>

    {error && !modalOpen && <Alert type="error" message={error} onClose={() => setError("")} />}

    {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
     <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-md">
       <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
       <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name, code or description..."
        className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
       />
      </div>

      <select
       value={filter}
       onChange={(event) => setFilter(event.target.value)}
       className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-400">
       <option value="ALL">All statuses</option>
       <option value="ACTIVE">Active only</option>
       <option value="INACTIVE">Inactive only</option>
       <option value="INITIAL">Initial status</option>
       <option value="FINAL">Final statuses</option>
      </select>
     </div>

     {loading ? (
      <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">Loading order statuses...</div>
     ) : filteredStatuses.length === 0 ? (
      <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
       <p className="font-medium text-gray-700">No statuses found</p>
       <p className="mt-1 text-sm text-gray-500">Add a status or change your search filters.</p>
      </div>
     ) : (
      <>
       <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[950px] text-left text-sm">
         <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
           <th className="px-5 py-4">Status</th>
           <th className="px-5 py-4">Code</th>
           <th className="px-5 py-4">Workflow</th>
           <th className="px-5 py-4">Sort Order</th>
           <th className="px-5 py-4">Availability</th>
           <th className="px-5 py-4 text-right">Actions</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-gray-100">
          {filteredStatuses.map((status) => (
           <tr key={status._id} className="hover:bg-gray-50/70">
            <td className="px-5 py-4">
             <div className="flex items-center gap-3">
              <span
               className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
               style={{ backgroundColor: status.color || "#6B7280" }}>
               {status.icon || status.name.charAt(0).toUpperCase()}
              </span>
              <div>
               <p className="font-semibold text-gray-900">{status.name}</p>
               {status.description && <p className="mt-1 max-w-xs truncate text-xs text-gray-500">{status.description}</p>}
              </div>
             </div>
            </td>
            <td className="px-5 py-4">
             <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{status.code}</code>
            </td>
            <td className="px-5 py-4">
             <div className="flex flex-wrap gap-1.5">
              {status.isInitial && <Tag>Initial</Tag>}
              {status.isFinal && <Tag>Final</Tag>}
              {!status.isInitial && !status.isFinal && <span className="text-gray-400">—</span>}
             </div>
            </td>
            <td className="px-5 py-4 text-gray-600">{status.sortOrder}</td>
            <td className="px-5 py-4">
             <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
               status.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
              }`}>
              {status.isActive ? "Active" : "Inactive"}
             </span>
            </td>
            <td className="px-5 py-4">
             <div className="flex justify-end gap-2">
              <ActionButton label="Edit status" onClick={() => openEditModal(status)}>
               <FaEdit />
              </ActionButton>
              <ActionButton label="Delete status" danger onClick={() => void handleDelete(status)}>
               <FaTrash />
              </ActionButton>
             </div>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>

       <div className="divide-y divide-gray-100 md:hidden">
        {filteredStatuses.map((status) => (
         <div key={status._id} className="space-y-3 p-4">
          <div className="flex items-start gap-3">
           <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: status.color || "#6B7280" }}>
            {status.icon || status.name.charAt(0).toUpperCase()}
           </span>
           <div className="min-w-0 flex-1">
            <p className="font-semibold">{status.name}</p>
            <p className="mt-1 break-all font-mono text-xs text-gray-500">{status.code}</p>
            {status.description && <p className="mt-1 text-sm text-gray-500">{status.description}</p>}
           </div>
           <span className={`rounded-full px-2 py-1 text-xs ${status.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
            {status.isActive ? "Active" : "Inactive"}
           </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
           {status.isInitial && <Tag>Initial</Tag>}
           {status.isFinal && <Tag>Final</Tag>}
           <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">Order: {status.sortOrder}</span>
          </div>

          <div className="flex justify-end gap-2">
           <button
            type="button"
            onClick={() => openEditModal(status)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
            <FaEdit /> Edit
           </button>
           <button
            type="button"
            onClick={() => void handleDelete(status)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <FaTrash /> Delete
           </button>
          </div>
         </div>
        ))}
       </div>
      </>
     )}

     <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
      Showing {filteredStatuses.length} of {statuses.length} statuses
     </div>
    </div>
   </div>

   {modalOpen && (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6">
     <div className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
       <div>
        <h2 className="text-lg font-bold">{editingId ? "Edit Order Status" : "Create Order Status"}</h2>
        <p className="mt-1 text-sm text-gray-500">This status is shared by all stores.</p>
       </div>
       <button
        type="button"
        onClick={closeModal}
        disabled={saving}
        aria-label="Close modal"
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50">
        <FaTimes />
       </button>
      </div>

      <form onSubmit={handleSubmit}>
       <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
        {error && <Alert type="error" message={error} onClose={() => setError("")} />}

        <div className="grid gap-4 sm:grid-cols-2">
         <FormField label="Status Name" required>
          <input
           required
           value={form.name}
           onChange={(event) => updateForm("name", event.target.value)}
           placeholder="e.g. Awaiting Confirmation"
           className="form-control"
          />
         </FormField>

         <FormField label="Status Code" required>
          <input
           required
           value={form.code}
           onChange={(event) =>
            updateForm(
             "code",
             event.target.value
              .toUpperCase()
              .replace(/[^A-Z0-9_\s-]/g, "")
              .replace(/[\s-]+/g, "_"),
            )
           }
           placeholder="e.g. AWAITING_CONFIRMATION"
           className="form-control font-mono"
          />
         </FormField>

         <FormField label="Description">
          <input
           value={form.description}
           onChange={(event) => updateForm("description", event.target.value)}
           placeholder="Optional description"
           className="form-control"
          />
         </FormField>

         <FormField label="Icon">
          <input value={form.icon} onChange={(event) => updateForm("icon", event.target.value)} placeholder="e.g. 📦" className="form-control" />
         </FormField>

         <FormField label="Status Color">
          <div className="flex gap-3">
           <input
            type="color"
            value={/^#[0-9A-Fa-f]{6}$/.test(form.color) ? form.color : "#6B7280"}
            onChange={(event) => updateForm("color", event.target.value)}
            className="h-11 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
           />
           <input value={form.color} onChange={(event) => updateForm("color", event.target.value)} placeholder="#6B7280" className="form-control font-mono" />
          </div>
         </FormField>

         <FormField label="Sort Order">
          <input
           type="number"
           min={0}
           value={form.sortOrder}
           onChange={(event) => updateForm("sortOrder", Number(event.target.value))}
           className="form-control"
          />
         </FormField>
        </div>

        <div className="space-y-3 rounded-xl border border-gray-200 p-4">
         <p className="text-sm font-semibold">Status Settings</p>
         <ToggleField
          title="Active"
          description="Allow this status to be used in the workflow."
          checked={form.isActive}
          onChange={(checked) => updateForm("isActive", checked)}
         />
         <ToggleField
          title="Initial Status"
          description="The starting status assigned when a new order is created. Only one initial status should exist."
          checked={form.isInitial}
          onChange={(checked) => updateForm("isInitial", checked)}
         />
         <ToggleField
          title="Final Status"
          description="Marks the end of the order workflow."
          checked={form.isFinal}
          onChange={(checked) => updateForm("isFinal", checked)}
         />
        </div>

        <div className="space-y-3">
         <div>
          <p className="text-sm font-semibold">Allowed Next Statuses</p>
          <p className="mt-1 text-xs text-gray-500">Select which statuses an order can move to from this status.</p>
         </div>

         {statuses.filter((status) => status._id !== editingId).length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Create another status to configure transitions.</p>
         ) : (
          <div className="grid gap-2 sm:grid-cols-2">
           {statuses
            .filter((status) => status._id !== editingId)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((status) => (
             <label key={status._id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
              <input
               type="checkbox"
               checked={form.nextStatusIds.includes(status._id)}
               onChange={() => toggleNextStatus(status._id)}
               className="h-4 w-4 accent-gray-900"
              />
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: status.color || "#6B7280" }} />
              <span className="min-w-0">
               <span className="block text-sm font-medium">{status.name}</span>
               <span className="block break-all font-mono text-xs text-gray-500">{status.code}</span>
              </span>
             </label>
            ))}
          </div>
         )}
        </div>
       </div>

       <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
         type="button"
         onClick={closeModal}
         disabled={saving}
         className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50">
         Cancel
        </button>
        <button
         type="submit"
         disabled={saving}
         className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
         {saving ? "Saving..." : editingId ? "Save Changes" : "Create Status"}
        </button>
       </div>
      </form>
     </div>
    </div>
   )}

   <style jsx>{`
    .form-control {
     width: 100%;
     min-width: 0;
     border: 1px solid #e5e7eb;
     border-radius: 0.5rem;
     padding: 0.65rem 0.75rem;
     font-size: 0.875rem;
     outline: none;
     background: #fff;
    }

    .form-control:focus {
     border-color: #9ca3af;
     box-shadow: 0 0 0 3px rgb(243 244 246);
    }
   `}</style>
  </div>
 );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
 return (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
   <p className="text-sm text-gray-500">{label}</p>
   <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
  </div>
 );
}

function Tag({ children }: { children: React.ReactNode }) {
 return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{children}</span>;
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
 return (
  <label className="block min-w-0 space-y-2">
   <span className="block text-sm font-medium text-gray-700">
    {label}
    {required && <span className="ml-1 text-red-500">*</span>}
   </span>
   {children}
  </label>
 );
}

function ToggleField({
 title,
 description,
 checked,
 onChange,
}: {
 title: string;
 description: string;
 checked: boolean;
 onChange: (checked: boolean) => void;
}) {
 return (
  <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-gray-100 p-3">
   <span>
    <span className="block text-sm font-medium">{title}</span>
    <span className="mt-1 block text-xs leading-5 text-gray-500">{description}</span>
   </span>
   <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-gray-900" />
  </label>
 );
}

function ActionButton({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
 return (
  <button
   type="button"
   aria-label={label}
   title={label}
   onClick={onClick}
   className={`rounded-lg border p-2.5 transition ${
    danger ? "border-red-100 text-red-600 hover:bg-red-50" : "border-gray-200 text-gray-600 hover:bg-gray-100"
   }`}>
   {children}
  </button>
 );
}

function Alert({ type, message, onClose }: { type: "error" | "success"; message: string; onClose: () => void }) {
 return (
  <div
   role="alert"
   className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-sm ${
    type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
   }`}>
   <span>{message}</span>
   <button type="button" onClick={onClose} aria-label="Dismiss message" className="shrink-0 opacity-70 hover:opacity-100">
    <FaTimes />
   </button>
  </div>
 );
}

OrderStatuses.Layout = "Admin";
