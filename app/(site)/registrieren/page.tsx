import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/site/auth-shell";
import { getCurrentTester } from "@/lib/auth/session";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Kostenlos registrieren",
  description: "Werde Produkttester:in bei TesterHero – kostenlos und unverbindlich.",
};

export default async function RegisterPage() {
  if (await getCurrentTester()) redirect("/konto");
  return (
    <AuthShell
      wide
      title="Werde TesterHero"
      subtitle="Lege dein kostenloses Profil an. Deine Adresse nutzen wir nur, um dir Testprodukte zu schicken."
      footer={
        <>
          Schon registriert?{" "}
          <Link href="/anmelden" className="font-semibold text-coral-600 hover:text-coral-700">
            Hier anmelden
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
