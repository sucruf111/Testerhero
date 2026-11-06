import { requireTester } from "@/lib/auth/session";
import { KontoNav } from "./konto-nav";

export default async function KontoLayout({ children }: { children: React.ReactNode }) {
  const tester = await requireTester("/konto");
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-widest text-coral-600 uppercase">Mein Bereich</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Hallo, {tester.firstName}!</h1>
        </div>
        <KontoNav />
      </div>
      <div className="mt-10">{children}</div>
    </div>
  );
}
