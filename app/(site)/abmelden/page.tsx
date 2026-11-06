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

  let tester: { firstName: string; status: string } | null = null;
  if (tokenValue) {
    const data = await verifyUnsubscribeToken(tokenValue);
    if (data) {
      tester =
        (await db.query.testers.findFirst({
          where: eq(schema.testers.id, data.testerId),
          columns: { firstName: true, status: true },
        })) ?? null;
    }
  } else {
    tester = await getCurrentTester();
  }

  if (!tester) {
    return (
      <AuthShell
        title="Abmelden"
        subtitle={tokenValue ? "Der Link funktioniert leider nicht." : "Log dich ein, dann kannst du dich abmelden."}
      >
        <LinkButton href="/anmelden?weiter=/abmelden" className="w-full">
          Einloggen
        </LinkButton>
        <p className="mt-4 text-sm text-muted">Du kommst nicht mehr in dein Konto? Antworte einfach auf eine unserer E-Mails.</p>
      </AuthShell>
    );
  }

  if (tester.status !== "active") {
    return (
      <AuthShell title="Du bist abgemeldet">
        <p className="text-ink-soft">
          Hallo {tester.firstName}, du bekommst keine Pakete und keine E-Mails mehr von uns. Wenn du doch wieder mitmachen willst,
          log dich ein.
        </p>
        <LinkButton href="/konto" variant="secondary" className="mt-5">
          Zu meinem Konto
        </LinkButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Abmelden" subtitle={`Hallo ${tester.firstName}, möchtest du keine Pakete mehr bekommen?`}>
      <UnsubscribeForm token={tokenValue} />
    </AuthShell>
  );
}
