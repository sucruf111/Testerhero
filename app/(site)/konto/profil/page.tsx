import type { Metadata } from "next";
import { Card } from "@/components/ui/misc";
import { requireTester } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { DeleteAccountForm, PasswordForm, ProfileForm, UnsubscribeBox } from "./forms";

export const metadata: Metadata = { title: "Profil & Einstellungen" };

export default async function ProfilePage() {
  const tester = await requireTester("/konto/profil");
  const values = {
    email: tester.email,
    firstName: tester.firstName,
    lastName: tester.lastName,
    street: tester.street,
    addressExtra: tester.addressExtra,
    postalCode: tester.postalCode,
    city: tester.city,
    country: tester.country,
    phone: tester.phone,
    birthYear: tester.birthYear,
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        <Card>
          <SectionTitle title="Persönliche Daten & Lieferadresse" text="An diese Adresse schicken wir deine Testprodukte." />
          <ProfileForm values={values} interests={tester.interests} notify={tester.notifyNewProducts} />
        </Card>
        <Card>
          <SectionTitle title="Passwort ändern" />
          <PasswordForm />
        </Card>
      </div>

      <aside className="space-y-8">
        <Card className="p-6 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Dein Konto</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Mitglied seit</dt>
              <dd className="font-semibold">{formatDate(tester.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">E-Mail bestätigt</dt>
              <dd className="font-semibold">{tester.emailVerifiedAt ? "Ja" : "Ausstehend"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Status</dt>
              <dd className="font-semibold">{tester.status === "active" ? "Aktiv" : tester.status === "unsubscribed" ? "Abgemeldet" : "Gesperrt"}</dd>
            </div>
          </dl>
        </Card>
        {tester.status === "active" && (
          <Card className="p-6 sm:p-6">
            <UnsubscribeBox notify={tester.notifyNewProducts} />
          </Card>
        )}
        <Card className="p-6 ring-red-100 sm:p-6">
          <DeleteAccountForm />
        </Card>
      </aside>
    </div>
  );
}

function SectionTitle({ title, text }: { title: string; text?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {text && <p className="mt-1 text-[15px] text-muted">{text}</p>}
    </div>
  );
}
