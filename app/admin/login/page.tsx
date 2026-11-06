import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getAdmin } from "@/lib/auth/session";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Agentur-Login", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-4">
      <div className="pointer-events-none absolute -top-40 -right-40 size-[36rem] rounded-full bg-coral-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-[30rem] rounded-full bg-lilac-500/20 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center">
          <Logo light />
        </div>
        <div className="mt-8 rounded-[2rem] bg-white p-8 shadow-lift">
          <h1 className="font-display text-2xl font-semibold">Agentur-Bereich</h1>
          <p className="mt-1 text-sm text-muted">Melde dich an, um Produkte, Tester und Bewertungen zu verwalten.</p>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
