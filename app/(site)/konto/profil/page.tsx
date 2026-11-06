import type { Metadata } from "next";
import { Card } from "@/components/ui/misc";
import { requireTester } from "@/lib/auth/session";
import { AdultPreferenceForm, DeleteAccountForm, PasswordForm, ProfileForm, UnsubscribeBox } from "./forms";

export const metadata: Metadata = { title: "Profil" };

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
    <div className="grid gap-5 lg:grid-cols-[1fr_17rem]">
      <div className="space-y-5">
        <Card>
          <h2 className="font-display text-lg font-bold">Deine Daten</h2>
          <p className="mt-0.5 mb-5 text-sm text-muted">An diese Adresse schicken wir deine Pakete.</p>
          <ProfileForm values={values} />
        </Card>
        <Card>
          <h2 className="font-display text-lg font-bold">Erotikprodukte</h2>
          <p className="mt-0.5 mb-4 text-sm text-muted">
            Freiwillig und nur ab 18. Du kannst das jederzeit wieder ändern.
          </p>
          <AdultPreferenceForm optIn={tester.adultOptIn} ageConfirmed={Boolean(tester.ageConfirmedAt)} />
        </Card>
        <Card>
          <h2 className="mb-4 font-display text-lg font-bold">Passwort ändern</h2>
          <PasswordForm />
        </Card>
      </div>

      <aside className="space-y-5">
        {tester.status === "active" && (
          <Card className="p-5 sm:p-5">
            <UnsubscribeBox />
          </Card>
        )}
        <Card className="p-5 sm:p-5">
          <DeleteAccountForm />
        </Card>
      </aside>
    </div>
  );
}
