"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Handy: Anmelde-Button bleibt unten sichtbar, sobald die Animation vorbei ist */
export function StickyCta({ freeSlots }: { freeSlots: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const story = document.getElementById("so-gehts");
    const footer = document.querySelector("footer");
    const update = () => {
      const pastStory = story ? story.getBoundingClientRect().bottom < window.innerHeight * 0.6 : window.scrollY > 600;
      const atFooter = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
      setShow(pastStory && !atFooter);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(27_26_46/0.25)] backdrop-blur transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!show}
    >
      <Link href="/registrieren" className={buttonClass("primary", "lg", "w-full")} tabIndex={show ? 0 : -1}>
        100 % kostenlos mitmachen <ArrowRight />
      </Link>
      <p className="mt-1.5 text-center text-xs text-muted">
        {freeSlots > 0 ? `Gerade noch ${freeSlots} Pakete frei` : "Kein Abo, keine Zahlungsdaten, jederzeit abmelden"}
      </p>
    </div>
  );
}
