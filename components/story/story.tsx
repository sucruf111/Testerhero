"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { FrameInfo, StoryEngine } from "./engine";
import { BoxPoster } from "./poster";
import { pickRandomProducts, type ExampleProduct } from "./products";

const STEPS = [
  {
    title: "Kostenlos anmelden",
    text: "Konto anlegen und E-Mail-Adresse bestätigen. Ab dann bist du bei jeder Auslosung automatisch dabei.",
  },
  {
    title: "Adresse hinterlegen",
    text: "Sag uns, wohin dein Paket soll. Der Versand ist kostenlos, und die Adresse nutzen wir nur dafür.",
  },
  {
    title: "Auf dein Paket warten",
    text: "Wirst du ausgelost, kommt ein Überraschungspaket zu dir. Was drin ist, siehst du erst beim Auspacken.",
  },
  {
    title: "Kurz bewerten",
    text: "Probier das Produkt aus und schreib uns in ein paar Sätzen, wie du es findest. Ehrlich, auch Kritik hilft. Behalten darfst du es so oder so.",
  },
];

const TRUST = ["Kein Abo", "Keine Zahlungsdaten", "Versand kostenlos", "Jederzeit abmelden"];

/** Sichtbarkeitsfenster der vier Schritte auf der Scroll-Strecke */
const WINDOWS: [number, number][] = [
  [0.13, 0.38],
  [0.38, 0.58],
  [0.58, 0.82],
  [0.82, 1.2],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

function canUse3D() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2) return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2"));
  } catch {
    return false;
  }
}

export function Story({ loggedIn, freeSlots }: { loggedIn: boolean; freeSlots: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const labelRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const labelNameRef = useRef<HTMLSpanElement>(null);
  const labelPriceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    if (!canUse3D()) {
      section.dataset.mode = "static";
      return;
    }
    section.dataset.mode = "3d";

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const products: ExampleProduct[] = pickRandomProducts(mobile ? 5 : 6);
    const winnerIndex = Math.floor(Math.random() * products.length);
    let engine: StoryEngine | null = null;
    let disposed = false;
    let shownLabel = -1;
    let visible = true;

    const progressFromScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      return total > 0 ? clamp01(-rect.top / total) : 0;
    };

    const setLabel = (index: number) => {
      if (index === shownLabel) return;
      shownLabel = index;
      if (labelNameRef.current) labelNameRef.current.textContent = products[index].name;
      if (labelPriceRef.current) labelPriceRef.current.textContent = products[index].price;
    };

    /** Bewegt Texte und Preisschild passend zur 3D-Szene, ohne React neu zu rendern */
    const onFrame = ({ progress: p, frontIndex, anchor }: FrameInfo) => {
      const hero = heroRef.current;
      if (hero) {
        const out = seg(p, 0.02, 0.11);
        hero.style.opacity = String(1 - out);
        hero.style.transform = `translate3d(0, ${-out * 40}px, 0)`;
        hero.style.pointerEvents = out > 0.5 ? "none" : "auto";
      }
      if (hintRef.current) hintRef.current.style.opacity = String(1 - seg(p, 0, 0.04));
      // auf dem Handy liegen die Sterne oben rechts: dort steht dann das Preisschild mit „Beispielprodukt“
      if (noteRef.current) noteRef.current.style.opacity = String(seg(p, 0.13, 0.17) * (mobile ? 1 - seg(p, 0.82, 0.85) : 1));

      let activeStep = -1;
      WINDOWS.forEach(([a, b], i) => {
        const el = captionRefs.current[i];
        if (!el) return;
        const o = seg(p, a, a + 0.035) * (1 - seg(p, b - 0.035, b));
        if (o > 0.5) activeStep = i;
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${(1 - o) * 18}px, 0)`;
        el.style.pointerEvents = o > 0.5 ? "auto" : "none";
      });
      dotRefs.current.forEach((dot, i) => {
        if (dot) dot.dataset.active = String(i === activeStep);
      });

      // Preisschild: läuft beim Auslosen mit, zeigt dann das ausgeloste Produkt
      const label = labelRef.current;
      if (label) {
        const spinning = p > 0.15 && p < 0.47;
        const revealed = p > 0.68;
        const o = spinning ? seg(p, 0.15, 0.18) * (1 - seg(p, 0.43, 0.47)) : revealed ? seg(p, 0.68, 0.72) : 0;
        setLabel(p > 0.33 ? winnerIndex : frontIndex);
        const x = anchor.x;
        const y = Math.min(anchor.y, window.innerHeight * 0.86);
        label.style.opacity = String(o);
        label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, 0)`;
      }
    };

    const updateActive = () => engine?.setActive(visible && !document.hidden);

    /** Die 3D-Box übernimmt im Einstieg genau den Platz des Platzhalterbilds */
    const syncHeroAnchor = () => {
      const poster = posterRef.current;
      const hero = heroRef.current;
      if (!engine || !poster || !hero) return;
      const c = canvas.getBoundingClientRect();
      const h = hero.getBoundingClientRect();
      const r = poster.getBoundingClientRect();
      if (!c.width || !c.height || !r.width) return;
      // Position relativ zum Einstieg messen, damit dessen Ausblend-Bewegung nicht stört
      const cx = r.left - h.left + r.width / 2;
      const cy = r.top - h.top + r.height / 2;
      engine.setHeroAnchor((cx / c.width) * 2 - 1, 1 - (cy / c.height) * 2, (r.width / c.width) * 2);
    };

    const load = () =>
      import("./engine").then(({ createStory }) => {
        if (disposed) return;
        try {
          engine = createStory({
            canvas,
            products,
            winnerIndex,
            mobile,
            onFrame,
            onReady: () => {
              section.dataset.ready = "true";
            },
          });
        } catch (error) {
          console.error(error);
          section.dataset.mode = "static";
          return;
        }
        syncHeroAnchor();
        engine.setProgress(progressFromScroll());
        updateActive();
      });

    // Erst laden, wenn der Browser Luft hat: Text und Buttons sind sofort da
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(load, { timeout: 1500 });
    else setTimeout(load, 300);

    const onScroll = () => engine?.setProgress(progressFromScroll());
    const onResize = () => {
      engine?.resize();
      syncHeroAnchor();
      onScroll();
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      engine?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateActive();
    });
    io.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", updateActive);

    return () => {
      disposed = true;
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", updateActive);
      engine?.dispose();
    };
  }, []);

  const ctaHref = loggedIn ? "/konto" : "/registrieren";
  const ctaLabel = loggedIn ? "Zu meinen Paketen" : "100 % kostenlos mitmachen";

  return (
    <section ref={sectionRef} id="so-gehts" className="story" aria-label="So funktioniert TesterHero">
      <div className="story-stage">
        <canvas ref={canvasRef} className="story-canvas" aria-hidden />

        {/* Einstieg */}
        <div ref={heroRef} className="story-hero absolute inset-0 z-10">
          <div className="mx-auto grid h-full max-w-6xl content-start gap-4 px-4 pt-20 sm:px-6 md:content-center md:gap-6 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 py-1 pr-3 pl-2 text-xs font-semibold text-ink-soft shadow-soft ring-1 ring-line backdrop-blur">
                <span className="relative flex size-2" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-coral-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-coral-500" />
                </span>
                {freeSlots > 0 ? `Gerade noch ${freeSlots} Pakete frei` : "Plätze pro Produkt begrenzt"}
              </p>
              <h1 className="font-display text-[clamp(1.9rem,9vw,2.6rem)] leading-[1.04] font-bold tracking-tight sm:text-6xl lg:text-[4.2rem]">
                Produkte testen. <span className="block text-coral-500">100 % kostenlos.</span>
              </h1>
              <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-ink-soft sm:mt-4 sm:text-[17px]">
                Hersteller wollen ehrliche Meinungen zu ihren Produkten. Darum verlosen wir sie an Tester wie dich:
                auspacken, ausprobieren, kurz bewerten und behalten.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5 md:mt-6">
                <Link href={ctaHref} className={buttonClass("primary", "lg", "shadow-glow")}>
                  {ctaLabel} <ArrowRight />
                </Link>
                {!loggedIn && (
                  // auf dem Handy steht „Einloggen“ im Menü, hier spart das Platz für die Box
                  <Link href="/anmelden" className={buttonClass("secondary", "lg", "hidden bg-white/80 backdrop-blur sm:inline-flex")}>
                    Einloggen
                  </Link>
                )}
              </div>
              <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium text-ink-soft sm:mt-4">
                {TRUST.map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-coral-500" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pointer-events-none flex justify-center lg:justify-end" aria-hidden>
              <div ref={posterRef} className="mt-2 w-36 sm:w-56 lg:mt-0 lg:mr-12 lg:w-80">
                <BoxPoster className="story-poster w-full" />
              </div>
            </div>
          </div>
        </div>

        <div ref={hintRef} className="story-scrollhint absolute inset-x-0 bottom-6 z-10 flex flex-col items-center text-xs font-semibold text-ink-soft">
          Scroll, um zu sehen, wie es geht
          <ChevronDown className="mt-1 size-4" />
        </div>

        {/* Preisschild am Beispielprodukt */}
        <div ref={labelRef} className="story-label pointer-events-none absolute top-0 left-0 z-10" aria-hidden>
          <div className="flex items-center gap-2 rounded-full bg-white/95 py-1.5 pr-3.5 pl-1.5 text-sm shadow-lift ring-1 ring-line whitespace-nowrap">
            <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-muted">Beispielprodukt</span>
            <span ref={labelNameRef} className="font-semibold" />
            <span ref={labelPriceRef} className="font-semibold text-coral-600" />
          </div>
        </div>

        {/* Hinweis: Es sind Beispiele aus dem Sortiment */}
        <div
          ref={noteRef}
          className="story-note pointer-events-none absolute top-[76px] right-4 z-10 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink-soft shadow-soft ring-1 ring-line backdrop-blur sm:right-6"
        >
          Beispielprodukte
        </div>

        {/* Die vier Schritte */}
        <div className="story-captions pointer-events-none absolute inset-x-3 bottom-3 z-20 sm:inset-x-auto sm:bottom-8 sm:left-8">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              ref={(el) => {
                captionRefs.current[i] = el;
              }}
              className={cn(
                "story-caption absolute inset-x-0 bottom-0 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-lift backdrop-blur-md sm:w-[22rem]",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-coral-500 text-sm font-bold text-white">{i + 1}</span>
                <h2 className="font-display text-lg font-bold">{step.title}</h2>
              </div>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{step.text}</p>
              {i === STEPS.length - 1 && (
                <Link href={ctaHref} className={buttonClass("primary", "md", "mt-3 w-full")}>
                  {ctaLabel} <ArrowRight />
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Fortschritt */}
        <div className="story-dots absolute top-1/2 right-5 z-10 hidden -translate-y-1/2 flex-col gap-2 md:flex" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className="size-2 rounded-full bg-ink/15 transition-all duration-300 data-[active=true]:h-6 data-[active=true]:bg-coral-500"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
