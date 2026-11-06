import { requireTester } from "@/lib/auth/session";
import { KontoNav } from "./konto-nav";

export default async function KontoLayout({ children }: { children: React.ReactNode }) {
  const tester = await requireTester("/konto");
  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 sm:pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">Hallo {tester.firstName}</h1>
        <KontoNav />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
