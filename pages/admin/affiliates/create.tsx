import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

interface Store {
 _id: string;
 name: string;
 slug: string;
 isActive: boolean;
}

export default function CreateAffiliatePage() {
 const router = useRouter();
 const { data: session, status: sessionStatus } = useSession();

 const [stores, setStores] = useState<Store[]>([]);
 const [loadingStores, setLoadingStores] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");

 const [form, setForm] = useState({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  storeId: "",
  commissionRate: "5",
  note: "",
  isActive: true,
 });

 useEffect(() => {
  if (sessionStatus !== "authenticated") return;
  if (session?.user?.role !== "SUPER_ADMIN") return;

  let cancelled = false;

  const loadStores = async () => {
   try {
    setLoadingStores(true);

    const response = await fetch("/api/admin/stores");
    const data = await response.json();

    if (!response.ok) {
     throw new Error(data.message || "Failed to load stores.");
    }

    if (cancelled) return;

    const activeStores: Store[] = (data.stores || []).filter((store: Store) => store.isActive);

    setStores(activeStores);

    setForm((current) => ({
     ...current,
     storeId: current.storeId || activeStores[0]?._id || "",
    }));
   } catch (err) {
    if (!cancelled) {
     setError(err instanceof Error ? err.message : "Failed to load stores.");
    }
   } finally {
    if (!cancelled) setLoadingStores(false);
   }
  };

  loadStores();

  return () => {
   cancelled = true;
  };
 }, [sessionStatus, session?.user?.role]);

 const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
  setForm((current) => ({ ...current, [key]: value }));
 };

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setError("");
  setSuccess("");

  if (form.password.length < 8) {
   setError("Password must contain at least 8 characters.");
   return;
  }

  if (form.password !== form.confirmPassword) {
   setError("Passwords do not match.");
   return;
  }

  const commissionRate = Number(form.commissionRate);

  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
   setError("Commission rate must be between 0 and 100.");
   return;
  }

  if (!form.storeId) {
   setError("Please select a store.");
   return;
  }

  try {
   setSaving(true);

   const response = await fetch("/api/admin/affiliates", {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
    },
    body: JSON.stringify({
     name: form.name.trim(),
     email: form.email.trim().toLowerCase(),
     phone: form.phone.trim(),
     password: form.password,
     storeId: form.storeId,
     commissionRate,
     note: form.note.trim(),
     isActive: form.isActive,
    }),
   });

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.message || "Failed to create Affiliate.");
   }

   setSuccess(`Affiliate created successfully. Referral code: ${data.affiliate?.code || "Created"}`);

   await router.push("/admin/affiliates");
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to create Affiliate.");
  } finally {
   setSaving(false);
  }
 };

 if (sessionStatus === "loading") {
  return <div className="flex min-h-[60vh] items-center justify-center">Loading...</div>;
 }

 if (session?.user?.role !== "SUPER_ADMIN") {
  return (
   <div className="p-6">
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
     <h1 className="text-lg font-semibold text-red-700">Access denied</h1>
     <p className="mt-2 text-sm text-red-600">Only SUPER_ADMIN can create Affiliate accounts.</p>
    </div>
   </div>
  );
 }

 return (
  <div className="mx-auto max-w-4xl space-y-6 p-6">
   <div>
    <Link href="/admin/affiliates" className="text-sm text-gray-500 hover:text-black">
     ← Back to Affiliates
    </Link>

    <h1 className="mt-3 text-2xl font-semibold text-gray-900">Create Affiliate</h1>

    <p className="mt-1 text-sm text-gray-500">Create an Affiliate login account and configure its store commission.</p>
   </div>

   <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
    <section className="space-y-4">
     <h2 className="text-base font-semibold text-gray-900">Account information</h2>

     <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-gray-700">
       Full name *
       <input
        required
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
        autoComplete="name"
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
        placeholder="Enter full name"
       />
      </label>

      <label className="text-sm font-medium text-gray-700">
       Email *
       <input
        required
        type="email"
        value={form.email}
        onChange={(e) => updateField("email", e.target.value)}
        autoComplete="email"
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
        placeholder="affiliate@example.com"
       />
      </label>

      <label className="text-sm font-medium text-gray-700">
       Phone
       <input
        type="tel"
        value={form.phone}
        onChange={(e) => updateField("phone", e.target.value)}
        autoComplete="tel"
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
        placeholder="Enter phone number"
       />
      </label>

      <label className="text-sm font-medium text-gray-700">
       Initial password *
       <input
        required
        type="password"
        minLength={8}
        value={form.password}
        onChange={(e) => updateField("password", e.target.value)}
        autoComplete="new-password"
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
        placeholder="At least 8 characters"
       />
      </label>

      <label className="text-sm font-medium text-gray-700 md:col-span-2">
       Confirm password *
       <input
        required
        type="password"
        minLength={8}
        value={form.confirmPassword}
        onChange={(e) => updateField("confirmPassword", e.target.value)}
        autoComplete="new-password"
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
        placeholder="Enter password again"
       />
      </label>
     </div>
    </section>

    <div className="border-t border-gray-100" />

    <section className="space-y-4">
     <h2 className="text-base font-semibold text-gray-900">Store and commission</h2>

     <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-gray-700">
       Store *
       <select
        required
        value={form.storeId}
        onChange={(e) => updateField("storeId", e.target.value)}
        disabled={loadingStores || stores.length === 0}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-black disabled:bg-gray-100">
        <option value="">{loadingStores ? "Loading stores..." : "Select a store"}</option>
        {stores.map((store) => (
         <option key={store._id} value={store._id}>
          {store.name}
         </option>
        ))}
       </select>
       {!loadingStores && stores.length === 0 && <span className="mt-1 block text-xs text-red-600">No active stores available.</span>}
      </label>

      <label className="text-sm font-medium text-gray-700">
       Commission rate (%) *
       <input
        required
        type="number"
        min={0}
        max={100}
        step="0.1"
        value={form.commissionRate}
        onChange={(e) => updateField("commissionRate", e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
       />
       <span className="mt-1 block text-xs text-gray-500">Default commission rate for this store.</span>
      </label>
     </div>
    </section>

    <div className="border-t border-gray-100" />

    <section className="space-y-4">
     <h2 className="text-base font-semibold text-gray-900">Administration</h2>

     <label className="block text-sm font-medium text-gray-700">
      Admin note
      <textarea
       rows={3}
       value={form.note}
       onChange={(e) => updateField("note", e.target.value)}
       className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
       placeholder="Internal notes about this Affiliate"
      />
     </label>

     <label className="flex items-center gap-3 text-sm text-gray-700">
      <input type="checkbox" checked={form.isActive} onChange={(e) => updateField("isActive", e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
      Enable account immediately
     </label>
    </section>

    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

    {success && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

    <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
     <Link
      href="/admin/affiliates"
      className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
      Cancel
     </Link>

     <button
      type="submit"
      disabled={saving || loadingStores || stores.length === 0}
      className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
      {saving ? "Creating..." : "Create Affiliate"}
     </button>
    </div>
   </form>
  </div>
 );
}

CreateAffiliatePage.Layout = "Admin";
