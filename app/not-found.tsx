import Link from "next/link";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-grain flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Link href="/" aria-label="Startseite">
        <Logo />
      </Link>
      <p className="mt-12 font-display text-8xl font-semibold text-coral-200">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Diese Seite gibt es leider nicht.</h1>
      <p className="mt-3 max-w-md text-muted">Vielleicht wurde der Produkttest beendet oder der Link ist nicht mehr aktuell.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/produkte">Aktuelle Produkttests</LinkButton>
        <LinkButton href="/" variant="secondary">
          Zur Startseite
        </LinkButton>
      </div>
    </div>
  );
}
