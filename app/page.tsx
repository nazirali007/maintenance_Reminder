import { redirect } from "next/navigation";
import { auth } from "@/auth";

// proxy.ts already redirects "/" before this ever renders — this is just a
// server-side safety net so the route never falls back to a blank/default
// page if middleware is ever bypassed.
export default async function Home() {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/login");
}
