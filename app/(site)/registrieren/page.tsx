import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/site/auth-shell";
import { getCurrentTester } from "@/lib/auth/session";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Kostenlos mitmachen",
  description: "Melde dich kostenlos bei TesterHero an und bekomm Überraschungspakete zum Testen.",
};

export default async function RegisterPage() {
  if (await getCurrentTester()) redirect("/konto");
  return (
    <AuthShell
      wide
      title="Kostenlos mitmachen"
      subtitle="Deine Adresse brauchen wir nur, um dir die Pakete zu schicken."
      footer={
        <>
          Schon angemeldet?{" "}
          <Link href="/anmelden" className="font-semibold text-coral-600 hover:text-coral-700">
            Hier einloggen
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
