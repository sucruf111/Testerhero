import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getAdmin } from "@/lib/auth/session";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Agentur-Login", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo light />
        </div>
        <div className="mt-6 rounded-2xl bg-white p-6">
          <h1 className="font-display text-xl font-bold">Agentur-Login</h1>
          <p className="mt-1 text-sm text-muted">Hier verwaltet ihr Produkte, Versand und Bewertungen.</p>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
