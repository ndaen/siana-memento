"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import BlurText from "@/components/BlurText";
import CountUp from "@/components/CountUp";
import StarBorder from "@/components/StarBorder";
import LightRays from "@/components/LightRays";

export default function HeroSection() {
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [titleDone, setTitleDone] = useState(false);

  useEffect(() => {
    if (!titleDone) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline();
      tl.fromTo(
        taglineRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      )
        .fromTo(
          priceRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
          "-=0.2"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "-=0.1"
        );
    });

    return () => mm.revert();
  }, [titleDone]);

  return (
    <section className="relative -mt-16 flex min-h-dvh flex-col items-center justify-center px-6 pb-16 pt-16 text-center">
      {/* Light Rays background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40 dark:opacity-50"
      >
        <LightRays
          raysOrigin="top-center"
          raysColor="#4a8c6f"
          raysSpeed={0.6}
          lightSpread={1.5}
          rayLength={2.5}
          pulsating
          fadeDistance={1.2}
          saturation={1.0}
        />
      </div>

      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl flex flex-wrap justify-center gap-[0.3em]">
          <BlurText
            text="Siana"
            className="text-foreground"
            delay={150}
            animateBy="letters"
            stepDuration={0.3}
          />
          <BlurText
            text="Memento"
            className="text-primary"
            delay={150}
            animateBy="letters"
            stepDuration={0.3}
            onAnimationComplete={() => setTitleDone(true)}
          />
        </h1>
      </div>

      <p
        ref={taglineRef}
        className="mx-auto mb-4 max-w-xl text-lg leading-relaxed text-muted-foreground sm:mb-6 sm:text-xl md:text-2xl"
        style={{ opacity: 0 }}
      >
        Générez votre Save the Date unique avec vos photos en{" "}
        <strong className="font-semibold text-foreground">15 minutes</strong>
      </p>

      <div
        ref={priceRef}
        className="mb-8 flex items-baseline gap-1.5 sm:mb-12"
        style={{ opacity: 0 }}
      >
        <span className="font-display text-4xl font-bold text-foreground sm:text-5xl">
          <CountUp to={19.9} from={0} duration={1.5} />
          <span>0&nbsp;€</span>
        </span>
        <span className="text-sm text-muted-foreground sm:text-base">
          par design
        </span>
      </div>

      <div ref={ctaRef} className="mb-8 sm:mb-12" style={{ opacity: 0 }}>
        <StarBorder as="a" color="#C9A84C" speed="4s" thickness={1} className="text-base cursor-pointer no-underline" href="/generate/upload">
          Créer mon Save the Date
        </StarBorder>
      </div>
    </section>
  );
}
