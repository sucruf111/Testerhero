"use client";

import { useActionState } from "react";
import { Megaphone } from "lucide-react";
import { notifyTestersAction } from "@/lib/actions/admin";
import { Checkbox } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDateTime } from "@/lib/format";
import type { FormState } from "@/lib/validation";

export function NotifyTestersForm({ productId, notifiedAt }: { productId: string; notifiedAt: string | null }) {
  const [state, action] = useActionState<FormState, FormData>(notifyTestersAction, {});
  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-lilac-50 to-coral-50 p-5 ring-1 ring-lilac-100 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
    >
      <input type="hidden" name="id" value={productId} />
      <div className="flex gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-lilac-500 shadow-soft">
          <Megaphone className="size-5" />
        </span>
        <div>
          <p className="font-semibold">Tester per E-Mail informieren</p>
          <p className="mt-0.5 text-sm text-muted">
            {state.message ?? state.error ?? (notifiedAt ? `Zuletzt informiert am ${formatDateTime(notifiedAt)}.` : "Schickt allen aktiven Testern mit aktivierten Benachrichtigungen eine E-Mail zu diesem Produkt.")}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Checkbox name="onlyInterested" label="Nur Tester mit passendem Interesse" className="text-sm" />
        <SubmitButton
          variant="dark"
          size="sm"
          pendingText="Wird versendet …"
          confirm={notifiedAt ? "Die Tester wurden bereits informiert. Trotzdem erneut senden?" : "E-Mail jetzt an alle passenden Tester senden?"}
        >
          E-Mail senden
        </SubmitButton>
      </div>
    </form>
  );
}
