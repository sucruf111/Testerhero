import type { Metadata } from "next";
import { CircleCheckBig, CircleX } from "lucide-react";
import { AuthShell } from "@/components/site/auth-shell";
import { LinkButton } from "@/components/ui/button";
import { confirmEmail } from "@/lib/auth/flows";

export const metadata: Metadata = { title: "E-Mail bestätigen", robots: { index: false } };

export default async function ConfirmEmailPage({ searchParams }: PageProps<"/email-bestaetigen">) {
  const { token } = await searchParams;
  const result = await confirmEmail(typeof token === "string" ? token : null);

  return (
    <AuthShell title={result.ok ? "Bestätigt!" : "Link ungültig"}>
      <div className="text-center">
        {result.ok ? (
          <>
            <span className="inline-grid size-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
              <CircleCheckBig className="size-8" />
            </span>
            <p className="mt-5 text-lg text-ink-soft">
              Danke, {result.firstName}! Deine E-Mail-Adresse ist bestätigt. Du kannst dich jetzt für Produkttests bewerben.
            </p>
            <LinkButton href="/produkte" size="lg" className="mt-7">
              Produkttests entdecken
            </LinkButton>
          </>
        ) : (
          <>
            <span className="inline-grid size-16 place-items-center rounded-3xl bg-red-50 text-red-600">
              <CircleX className="size-8" />
            </span>
            <p className="mt-5 text-ink-soft">
              Der Bestätigungslink ist abgelaufen oder ungültig. Melde dich an – in deinem Konto kannst du einen neuen Link anfordern.
            </p>
            <LinkButton href="/konto" className="mt-7">
              Zu meinem Konto
            </LinkButton>
          </>
        )}
      </div>
    </AuthShell>
  );
}
