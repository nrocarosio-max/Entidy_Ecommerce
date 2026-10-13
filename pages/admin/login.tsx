import { FormEvent, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function AdminLogin() {
 const router = useRouter();

 const { data: session, status } = useSession();

 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 function getRedirectPath(role?: string) {
  if (role === "SUPER_ADMIN") {
   return "/admin";
  }

  if (role === "AFFILIATE") {
   return "/affiliate";
  }

  if (role) {
   return "/pos";
  }

  return "/admin/login";
 }
 useEffect(() => {
  if (status === "authenticated") {
   const role = session?.user?.role as string | undefined;

   router.replace(getRedirectPath(role));
  }
 }, [status, session, router]);

 async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setError("");
  setLoading(true);

  try {
   const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
   });

   if (!result?.ok || result.error) {
    setError("Invalid email or password.");
    return;
   }

   const sessionResponse = await fetch("/api/auth/session", {
    cache: "no-store",
   });

   const currentSession = await sessionResponse.json();

   const role = currentSession?.user?.role as string | undefined;

   if (!role) {
    setError("Unable to determine your account role. Please sign in again.");
    return;
   }

   const redirectPath = role === "AFFILIATE" ? "/affiliate" : "/admin";

   await router.replace(redirectPath);
  } catch (error) {
   console.error("LOGIN ERROR:", error);
   setError("An error occurred while signing in. Please try again.");
  } finally {
   setLoading(false);
  }
 }

 if (status === "loading") {
  return (
   <div className="flex min-h-screen items-center justify-center bg-gray-100">
    <div className="text-sm text-gray-500">Loading...</div>
   </div>
  );
 }

 if (session) {
  return null;
 }

 return (
  <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
   <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
    <div className="mb-8">
     <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>

     <p className="mt-2 text-sm text-gray-500">Sign in to access the administration panel.</p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-5">
     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>

      <input
       type="email"
       value={email}
       onChange={(event) => setEmail(event.target.value)}
       placeholder="admin@example.com"
       required
       className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
      />
     </div>

     <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>

      <input
       type="password"
       value={password}
       onChange={(event) => setPassword(event.target.value)}
       placeholder="••••••••"
       required
       className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
      />
     </div>

     {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

     <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
      {loading ? "Signing in..." : "Sign In"}
     </button>
    </form>
   </div>
  </main>
 );
}

AdminLogin.Layout = "Admin";
