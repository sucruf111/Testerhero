import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { AuthShell } from "@/components/site/auth-shell";
import { LinkButton } from "@/components/ui/button";
import { getCurrentTester } from "@/lib/auth/session";
import { verifyUnsubscribeToken } from "@/lib/auth/tokens";
import { db, schema } from "@/lib/db";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = { title: "Abmelden", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: PageProps<"/abmelden">) {
  const { token } = await searchParams;
  const tokenValue = typeof token === "string" ? token : null;

  let tester: { firstName: string; status: string; notifyNewProducts: boolean } | null = null;
  if (tokenValue) {
    const data = await verifyUnsubscribeToken(tokenValue);
    if (data) {
      tester =
        (await db.query.testers.findFirst({
          where: eq(schema.testers.id, data.testerId),
          columns: { firstName: true, status: true, notifyNewProducts: true },
        })) ?? null;
    }
  } else {
    tester = await getCurrentTester();
  }

  if (!tester) {
    return (
      <AuthShell title="Abmelden" subtitle={tokenValue ? "Dieser Abmeldelink ist leider ungültig." : "Melde dich an, um deine E-Mail-Einstellungen zu ändern oder dich abzumelden."}>
        <div className="flex flex-col gap-3">
          <LinkButton href="/anmelden?weiter=/abmelden" size="lg">
            Anmelden
          </LinkButton>
          <p className="text-center text-sm text-muted">
            Kein Zugriff mehr auf dein Konto? Antworte einfach auf eine unserer E-Mails – wir kümmern uns darum.
          </p>
        </div>
      </AuthShell>
    );
  }

  if (tester.status !== "active") {
    return (
      <AuthShell title="Du bist abgemeldet" subtitle={`Hallo ${tester.firstName}, du erhältst keine Produkte und E-Mails mehr von uns.`}>
        <div className="text-center">
          <p className="text-ink-soft">Du möchtest doch wieder mitmachen? Melde dich an und reaktiviere dein Konto.</p>
          <LinkButton href="/konto" variant="secondary" className="mt-6">
            Zu meinem Konto
          </LinkButton>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Schade, dass du gehst" subtitle={`Hallo ${tester.firstName}, wie möchtest du weitermachen?`}>
      <UnsubscribeForm token={tokenValue} notify={tester.notifyNewProducts} />
    </AuthShell>
  );
}
