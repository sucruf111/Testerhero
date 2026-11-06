import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/claims";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <div className="max-w-xl">
      <PageHeader title="Einstellungen" description="Diese Regeln gelten für die Auslosung. Tester sehen sie auch auf der Startseite." />
      <SettingsForm
        values={{
          maxClaimsPerWindow: String(settings.maxClaimsPerWindow),
          claimWindowDays: String(settings.claimWindowDays),
          maxOpenTests: String(settings.maxOpenTests),
        }}
      />
    </div>
  );
}
