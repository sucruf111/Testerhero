import type { Metadata } from "next";
import { AuthShell } from "@/components/site/auth-shell";
import { LinkButton } from "@/components/ui/button";
import { isResetTokenValid } from "@/lib/auth/flows";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Neues Passwort festlegen", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/passwort-zuruecksetzen">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : null;
  const valid = await isResetTokenValid(value);

  return (
    <AuthShell title="Neues Passwort" subtitle={valid ? "Mindestens 8 Zeichen." : undefined}>
      {valid && value ? (
        <ResetForm token={value} />
      ) : (
        <div>
          <p className="text-ink-soft">Der Link ist abgelaufen oder wurde schon benutzt.</p>
          <LinkButton href="/passwort-vergessen" className="mt-4">
            Neuen Link anfordern
          </LinkButton>
        </div>
      )}
    </AuthShell>
  );
}
