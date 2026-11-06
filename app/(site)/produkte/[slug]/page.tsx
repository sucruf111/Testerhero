import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, ClipboardList, Gift, Heart, PackageCheck, PartyPopper, Tag, Users } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { Badge } from "@/components/ui/misc";
import { getCurrentTester } from "@/lib/auth/session";
import { APPLICATION_STATUS } from "@/lib/constants";
import { deadlineLabel, formatEuro, formatLongDate, isDeadlinePassed } from "@/lib/format";
import { getApplicationFor, getProductBySlug } from "@/lib/queries";
import { ApplyForm } from "./apply-form";

export async function generateMetadata({ params }: PageProps<"/produkte/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status === "draft") return { title: "Produkt nicht gefunden" };
  return { title: product.title, description: product.shortDescription };
}

export default async function ProductPage({ params }: PageProps<"/produkte/[slug]">) {
  const { slug } = await params;
  const [product, tester] = await Promise.all([getProductBySlug(slug), getCurrentTester()]);
  if (!product || product.status === "draft") notFound();

  const application = tester ? await getApplicationFor(product.id, tester.id) : null;
  const remaining = Math.max(0, product.slots - product.takenSlots);
  const closed = product.status !== "active" || isDeadlinePassed(product.applicationDeadline);
  const price = formatEuro(product.retailPriceCents);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <Link href="/produkte" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Alle Produkttests
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="aspect-square overflow-hidden rounded-[2rem] bg-white shadow-lift ring-1 ring-line/70">
            <ProductImage src={product.imageUrl} alt={product.title} category={product.category} />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="coral" dot={false}>
              <Tag className="size-3" /> {product.category}
            </Badge>
            {closed ? <Badge tone="slate">Bewerbung geschlossen</Badge> : <Badge tone="green">Bewerbung offen</Badge>}
          </div>
          {product.brand && <p className="mt-5 text-sm font-semibold tracking-wider text-coral-600 uppercase">{product.brand}</p>}
          <h1 className="mt-1 font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">{product.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">{product.shortDescription}</p>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Fact icon={<Users />} label="Freie Plätze" value={`${remaining} von ${product.slots}`} />
            <Fact
              icon={<CalendarClock />}
              label="Bewerbungsschluss"
              value={product.applicationDeadline ? formatLongDate(product.applicationDeadline) : "Solange Plätze frei"}
              hint={deadlineLabel(product.applicationDeadline) ?? undefined}
            />
            {price && <Fact icon={<Gift />} label="Warenwert" value={price} />}
          </dl>

          {/* Bewerbungsbox */}
          <div className="mt-8 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-line/70 sm:p-7">
            <ApplyBox
              closed={closed}
              remaining={remaining}
              productId={product.id}
              productSlug={product.slug}
              tester={tester}
              application={application ?? null}
            />
          </div>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold">Über das Produkt</h2>
            <div className="prose-plain mt-4 text-[16px] leading-relaxed whitespace-pre-line text-ink-soft">{product.description}</div>
          </section>

          {product.testInstructions && (
            <section className="mt-10 rounded-3xl bg-lilac-50 p-6 ring-1 ring-lilac-100 sm:p-7">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                <ClipboardList className="size-5 text-lilac-500" /> Darauf kommt es beim Test an
              </h2>
              <div className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink-soft">{product.testInstructions}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-line/70">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted [&_svg]:size-3.5 [&_svg]:text-coral-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 font-semibold text-ink">{value}</dd>
      {hint && <dd className="mt-0.5 text-xs font-medium text-coral-600">{hint}</dd>}
    </div>
  );
}

type ApplyBoxProps = {
  closed: boolean;
  remaining: number;
  productId: string;
  productSlug: string;
  tester: Awaited<ReturnType<typeof getCurrentTester>>;
  application: Awaited<ReturnType<typeof getApplicationFor>> | null;
};

function ApplyBox({ closed, remaining, productId, productSlug, tester, application }: ApplyBoxProps) {
  if (application && application.status !== "withdrawn") {
    const s = APPLICATION_STATUS[application.status];
    const copy = {
      pending: { icon: <PartyPopper />, title: "Deine Bewerbung ist eingegangen!", text: "Wir melden uns per E-Mail, sobald die Auswahl steht." },
      accepted: { icon: <PartyPopper />, title: "Du bist dabei!", text: "Wir bereiten den Versand vor. Die Sendungsnummer bekommst du per E-Mail." },
      shipped: { icon: <PackageCheck />, title: "Dein Paket ist unterwegs!", text: "Bestätige den Empfang in deinem Konto, sobald es angekommen ist." },
      received: { icon: <PackageCheck />, title: "Viel Spaß beim Testen!", text: "Wir freuen uns auf deine ehrliche Bewertung." },
      reviewed: { icon: <Heart />, title: "Danke für deine Bewertung!", text: "Dein Feedback ist beim Produktteam angekommen." },
      rejected: { icon: <Heart />, title: "Diesmal hat es leider nicht geklappt.", text: "Schau dir gern die anderen Produkttests an." },
    }[application.status];
    return (
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-coral-50 text-coral-500 [&_svg]:size-6">{copy.icon}</span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold">{copy.title}</h2>
            </div>
            <p className="mt-1 text-[15px] text-muted">{copy.text}</p>
            <Badge tone={s.tone} className="mt-2.5">
              {s.testerLabel}
            </Badge>
          </div>
        </div>
        <LinkButton href="/konto" variant="secondary">
          Zu meinen Tests
        </LinkButton>
      </div>
    );
  }
  if (closed) {
    return (
      <p className="text-ink-soft">
        Die Bewerbungsphase für dieses Produkt ist beendet. <Link href="/produkte" className="font-semibold text-coral-600 underline-offset-2 hover:underline">Schau dir die aktuellen Produkttests an.</Link>
      </p>
    );
  }
  if (!tester) {
    return (
      <div>
        <h2 className="font-display text-xl font-semibold">Lust, das zu testen?</h2>
        <p className="mt-1.5 text-[15px] text-muted">Melde dich an oder registriere dich kostenlos, um dich zu bewerben.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/registrieren">Kostenlos registrieren</LinkButton>
          <LinkButton href={`/anmelden?weiter=/produkte/${productSlug}`} variant="secondary">
            Anmelden
          </LinkButton>
        </div>
      </div>
    );
  }
  if (tester.status !== "active") {
    return (
      <Alert tone="info" title="Dein Konto ist pausiert.">
        {tester.status === "unsubscribed" ? (
          <>
            Du hast dich abgemeldet. <Link href="/konto" className="font-semibold underline">Reaktiviere dein Konto</Link>, um dich wieder zu bewerben.
          </>
        ) : (
          "Bitte wende dich an unser Team, falls du Fragen hast."
        )}
      </Alert>
    );
  }
  if (!tester.emailVerifiedAt) {
    return (
      <Alert tone="info" title="Fast geschafft!">
        Bitte bestätige zuerst deine E-Mail-Adresse über den Link in deinem Postfach. Danach kannst du dich bewerben.{" "}
        <Link href="/konto" className="font-semibold underline">Bestätigungs-E-Mail erneut senden</Link>
      </Alert>
    );
  }
  return <ApplyForm productId={productId} full={remaining === 0} />;
}
