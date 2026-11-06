import Link from "next/link";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Link href="/" aria-label="Startseite">
        <Logo />
      </Link>
      <h1 className="mt-10 font-display text-3xl font-bold">Diese Seite gibt es nicht.</h1>
      <p className="mt-2 text-muted">Vielleicht ist der Link alt oder falsch geschrieben.</p>
      <LinkButton href="/" className="mt-6">
        Zur Startseite
      </LinkButton>
    </div>
  );
}
