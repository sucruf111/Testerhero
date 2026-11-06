import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/site/auth-shell";
import { getCurrentTester } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: PageProps<"/anmelden">) {
  const { weiter } = await searchParams;
  const next = typeof weiter === "string" ? weiter : "";
  if (await getCurrentTester()) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/konto");

  return (
    <AuthShell
      title="Willkommen zurück!"
      subtitle="Melde dich an, um dich zu bewerben und deine Tests zu verwalten."
      footer={
        <>
          Noch kein Konto?{" "}
          <Link href="/registrieren" className="font-semibold text-coral-600 hover:text-coral-700">
            Kostenlos registrieren
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
