import type { Metadata } from "next";
import { AuthShell } from "@/components/site/auth-shell";
import { LinkButton } from "@/components/ui/button";
import { confirmEmail } from "@/lib/auth/flows";

export const metadata: Metadata = { title: "E-Mail bestätigen", robots: { index: false } };

export default async function ConfirmEmailPage({ searchParams }: PageProps<"/email-bestaetigen">) {
  const { token } = await searchParams;
  const result = await confirmEmail(typeof token === "string" ? token : null);

  return result.ok ? (
    <AuthShell title="Geschafft!">
      <p className="text-ink-soft">
        Danke, {result.firstName}. Deine E-Mail-Adresse ist bestätigt und du bist jetzt dabei. Sobald du ausgelost wirst,
        bekommst du eine E-Mail von uns.
      </p>
      <LinkButton href="/konto" className="mt-5">
        Zu meinem Konto
      </LinkButton>
    </AuthShell>
  ) : (
    <AuthShell title="Der Link funktioniert nicht">
      <p className="text-ink-soft">
        Der Link ist abgelaufen oder nicht vollständig. Log dich ein, dann kannst du dir einen neuen Link schicken lassen.
      </p>
      <LinkButton href="/konto" className="mt-5">
        Zu meinem Konto
      </LinkButton>
    </AuthShell>
  );
}
