---
baseline_commit: f4c179db4dfdbd10699e032c79efff54df2f07ea
---

# Story 7.2: Hero Avant/Après

Status: done

<!-- Note: Validation optionnelle — run validate-create-story avant dev-story. -->

## Story

En tant que visiteur arrivant sur le site,
je veux voir immédiatement la promesse produit à travers un visuel avant/après,
afin de comprendre le résultat en une seconde sans lire.

## Acceptance Criteria

1. **Given** un visiteur arrivant sur l'URL racine
   **When** la page se charge
   **Then** il voit une scène unique montrant une photo de couple et le Save the Date fini, avec titre, pricing 19.90€ et CTA "Créer mon Save the Date · 15 min" (FR27)

2. **Given** la landing sur mobile
   **When** un visiteur la consulte
   **Then** le CTA est accessible sans scroll, LCP <2.5s (NFR-P2), et Lighthouse Perf ≥90 / SEO ≥95 (NFR-P7) — balises OG/meta préservées

## Décisions structurantes (à trancher avant implémentation)

- **D1 — Remplace `HeroSection.tsx`** (Epic 5, `src/components/siana/landing/HeroSection.tsx`). Le hero actuel n'a ni visuel avant/après ni promesse de temps ; on le refond entièrement.
- **D2 — LCP d'abord.** Le H1, le pricing et le CTA sont rendus **côté serveur** (statiques), image hero en `next/image` avec `priority`. Toute animation d'entrée (GSAP) est client, gated `prefers-reduced-motion`, et ne doit **jamais** retarder le LCP. La `LightRays` WebGL actuelle est un risque LCP/perf mobile → la retirer ou la charger en différé (décider selon mesure Lighthouse).
- **D3 — CTA = `CtaButton` (7.1)** avec `timePromise="15 min"` → rend « Créer mon Save the Date · 15 min ». Remplace le `StarBorder` ReactBits. `Eyebrow` pour tout label.
- **D4 — Pricing conservé** : « 19,90 € » + « par design ». `CountUp` optionnel (garder simple pour LCP ; un prix statique suffit).
- **D5 — OG/meta INTOUCHÉS** dans `layout.tsx` (title, description, openGraph, twitter, metadataBase). ⚠️ `public/og-image.jpg` semble absent — vérifier et l'ajouter si manquant (l'AC exige les balises OG préservées et fonctionnelles).
- **D6 — Assets avant/après** : le « après » = un Save the Date fini (réutiliser un `public/home/*.png`). Le « avant » = une photo brute de couple — **asset à fournir** (voir Dépendances). Utiliser un placeholder propre en attendant.

## Tasks / Subtasks

- [x] Task 1 — Scène avant/après (AC: 1)
  - [x] Nouveau hero (server component) : Save the Date fini (`next/image` `priority`) + photo brute en incrustation, dans une scène unique, responsive
  - [x] `Eyebrow` + H1 (`font-display`) + sous-titre
- [x] Task 2 — Pricing + CTA promesse de temps (AC: 1, 2)
  - [x] Pricing « 19,90 € · par design »
  - [x] `<CtaButton href="/generate/upload">Créer mon Save the Date</CtaButton>` (promesse « 15 min ») — vérifié above the fold sur mobile (390×844) par capture
- [x] Task 3 — Animation d'entrée optionnelle + reduced-motion (AC: 2, NFR-A)
  - [x] Décision : **aucune animation JS** (server component, LCP-first) → `prefers-reduced-motion` trivialement satisfait (rien à réduire). `LightRays` WebGL et animations ReactBits de l'ancien hero retirées (risque LCP/perf mobile)
- [x] Task 4 — SEO / OG (AC: 2)
  - [x] `layout.tsx` meta **intactes** (title, description, openGraph, twitter, metadataBase — non touchées)
  - [x] `public/og-image.jpg` produit (1200×630, composite selfie casual + STD Bohème via `sharp`, couple "Camille & Hugo") — balises OG désormais fonctionnelles
- [x] Task 5 — Tests & perf (AC: 1, 2)
  - [x] `e2e/home.spec.ts` : aucune modification nécessaire (copy choisie pour préserver les assertions — tagline conserve « Save the Date qui vous ressemble » en match unique, H1 distinct, « par design » conservé, CTA compatible) — **39/39 verts**
  - [x] Lighthouse mesuré sur preview Vercel (2026-07-14) : **Performance 98**, Accessibility 96, Best Practices 96, **LCP 1.0s**. SEO 63 sur l'URL de preview — seul échec : « Page is blocked from indexing », dû au `x-robots-tag: noindex` que Vercel applique automatiquement aux URLs de déploiement à hash (protection anti-duplicate-content), pas au code de l'app. **Confirmé sur le vrai domaine de production : SEO 100.** Tous les gates AC2 satisfaits.

### Review Findings

<!-- Code review 2026-07-14 (Blind Hunter + Edge Case Hunter + Acceptance Auditor, Opus). -->

- [x] [Review][Patch] Légendes trop petites/peu contrastées — « Votre photo » et figcaption `Eyebrow` passées de `text-[0.6rem]`/`text-[0.65rem]` à `text-xs` (12px) [siana-memento-web/src/components/siana/landing/HeroSection.tsx:58,77]
- [x] [Review][Patch] `sizes` de la vignette avant rendu responsive (`96px`/`112px`/`128px` par breakpoint) [siana-memento-web/src/components/siana/landing/HeroSection.tsx:72]
- [x] [Review][Defer] `public/og-image.jpg` 404 — dépendance asset Aldo (fournir 1200×630 ou générer via Gemini) ; bloque l'aperçu OG au merge — deferred, dépendance
- [x] [Review][Defer] Lighthouse mobile (Perf ≥90 / SEO ≥95 / LCP <2.5s) non mesuré — confirmer sur preview Vercel avant merge — deferred, vérif hors dev local
- [x] [Review][Defer] Images hero PNG lourdes (2,0 Mo / 1,6 Mo) — `next/image` ré-encode au service (prod OK) mais pré-optimiser les sources réduit le risque LCP/saturation optimiseur ; lié à la vérif Lighthouse — deferred
- [x] [Review][Defer] Couple avant/après fabriqué par IA (déviation D6, vraie photo attendue) — remplacer par de vrais couples plus tard — deferred, ok launch/démo
- [x] [Review][Resolved] `DecorativeMotif variant="branch"` (feuille SVG à droite) retiré à la demande d'Aldo — `overflow-hidden` supprimé du même coup (n'était nécessaire qu'au motif), ce qui lève aussi le risque de clip de la vignette avant

## Dev Notes

### Stack & contexte (vérifié 2026-07-12)

- App `siana-memento-web/` — Next.js 16.1.6, App Router, React 19, TS, alias `@/*`. Tailwind v4 : tokens dans `globals.css` `@theme`, utilities `font-display`/`font-body`, couleurs sémantiques (`bg-primary` = Sage Green), radius `rounded-3xl`/`4xl`. **Aucun nouveau token/font/dépendance sans accord ; jamais de hex en dur.**
- Landing = `src/app/page.tsx` (server component, `force-dynamic`) `[Source: src/app/page.tsx#13]`. Hero = `<HeroSection />` `[#77]`.
- Primitives 7.1 : `Eyebrow` (`@/components/ui/eyebrow`), `CtaButton` (`@/components/siana/landing/CtaButton` — `href`/`asChild`/`timePromise`/`children`), `DecorativeMotif`.
- `SiteHeader` global affiche le CTA « Créer mon Save the Date » au scroll ; garder cohérence de wording.
- ReactBits dispo (`src/components/`) : BlurText, CountUp, StarBorder, LightRays. GSAP 3.14.2 + @gsap/react installés.

### Hero actuel à remplacer

`src/components/siana/landing/HeroSection.tsx` (client) : H1 « Siana » + « Memento » (2× `BlurText`), sous-titre « Générez le Save the Date qui vous ressemble avec vos propres photos » `[#88]`, prix `CountUp` 19,90 € + « par design » `[#96-102]`, CTA `StarBorder` → `/generate/upload` « Créer mon Save the Date » `[#106-108]`, fond `LightRays` WebGL `raysColor="#4a8c6f"` `[#47-61]`. **Pas d'avant/après, pas de promesse de temps.**

### e2e à mettre à jour — `e2e/home.spec.ts`

- `#13` H1 visible (garder un H1 unique) ; `#14` texte `/Save the Date qui vous ressemble/i` (adapter si le sous-titre change) ; `#15` « par design » (garder ou adapter) ; `#16` `#main-content` lien `/créer mon save the date/i` (le suffixe « · 15 min » reste compatible avec la regex). Corriger le **composant** si une assertion casse, pas l'inverse — sauf changement de copy volontaire, alors adapter le test.

### Dépendances / prérequis (à signaler à Aldo)

- **Photo « avant » (couple brut)** : aucun asset dédié. Options : réutiliser une photo existante, en fournir une, ou placeholder. Le rendu « avant/après » n'est pleinement satisfait qu'avec une vraie paire.
- **`og-image.jpg`** : référencé par `layout.tsx` mais introuvable sous `public/`. À produire (1200×630) pour que l'AC OG soit réellement respectée.

### Garde-fous NFR

- LCP <2.5s (NFR-P2), Lighthouse Perf ≥90 / SEO ≥95 mobile (NFR-P7), `prefers-reduced-motion` (NFR-A), WCAG AA, CTA touch target ≥44px (`CtaButton` = `h-11`). Image hero optimisée (`next/image`, dimensions, priority).

### Project Structure Notes

- Refonte in place de `HeroSection.tsx` (garder le chemin) ou nouveau composant `siana/landing/` importé par `page.tsx`. Pas de barrel, import via `@/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Patterns Landing Narratifs — hero avant/après]
- [Source: siana-memento-web/src/app/layout.tsx#11-44 — metadata OG à préserver]
- [Source: siana-memento-web/src/components/siana/landing/HeroSection.tsx — hero à remplacer]
- [Source: siana-memento-web/src/components/siana/landing/CtaButton.tsx — CTA promesse de temps (7.1)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (1M context)

### Debug Log References

- Aucun blocage. Vérification visuelle mobile (390×844) + desktop (1280) par capture Playwright.

### Completion Notes List

- `HeroSection.tsx` réécrit en **server component** (suppression `use client`, GSAP, `BlurText`/`CountUp`/`StarBorder`/`LightRays`). Contenu (Eyebrow, H1, tagline, pricing, CTA) rendu serveur pour le LCP ; image « après » en `priority`.
- Scène avant/après : le Save the Date fini (`/home/hero-std.png`) en œuvre principale (`figure` `rounded-3xl`), photo du couple (`/home/hero-couple.png`) en incrustation.
- **Images générées par Gemini** (à la demande d'Aldo) : `gemini-2.5-flash-image` (même SDK/modèle que `generation_service.ts`), via un script standalone jetable. (1) photo de couple photoréaliste en **text→image**, puis (2) son STD en **image→image** avec le vrai prompt produit (Bohème / Terre & Sauge). Résultat : même couple sur l'avant et l'après, reproduisant le parcours produit. Placeholder « caméra » supprimé.
- CTA = `CtaButton` (7.1) → « Créer mon Save the Date · 15 min ». Pricing « 19,90 € · par design ». Ordre mobile : texte+CTA d'abord → CTA above the fold vérifié.
- `Eyebrow` (défaut + variant `accent` sur la légende), `DecorativeMotif variant="branch"` discret (`text-primary/10`, `lg` uniquement).
- Meta OG/twitter de `layout.tsx` non touchées. `og-image.jpg` reste à produire (dépendance).
- Copy choisie pour ne casser aucune assertion e2e (tagline garde « Save the Date qui vous ressemble » en match unique ; H1 « Votre Save the Date, à votre image » distinct). e2e complet **39/39**, `tsc` + eslint clean, `next build` OK (19/19 statique).
- Pas de nouveau test : story visuelle, couverture e2e existante = régression. Pas de nouveau token/dépendance.

### Dépendances restantes (Aldo)

- ~~Photo « avant » réelle~~ → **levée** : avant/après générés par Gemini (couple photoréaliste + son STD, même couple).
- **`public/og-image.jpg`** (1200×630) — toujours absent, pour l'aperçu social. (Pourrait aussi être généré via Gemini si souhaité.)
- **Confirmation Lighthouse** (Perf ≥90 / SEO ≥95 / LCP <2.5s) sur le preview Vercel.
- **Note images générées** : couple fabriqué par IA — ok pour lancement/démo ; remplacer par de vrais couples (ex. testimonials) si voulu plus tard.

### File List

- `siana-memento-web/src/components/siana/landing/HeroSection.tsx` — UPDATE : hero avant/après (server component)
- `siana-memento-web/src/app/page.tsx` — UPDATE : commentaire hero actualisé
- `siana-memento-web/public/home/hero-couple.png` — NEW : selfie casual de couple (Gemini text→image), l'« avant »
- `siana-memento-web/public/home/hero-std.png` — NEW : STD Bohème "Camille & Hugo" (Gemini image→image), l'« après »
- `siana-memento-web/public/og-image.jpg` — NEW : aperçu social 1200×630, composite des deux images ci-dessus via `sharp`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — UPDATE : statut 7.2
- `_bmad-output/implementation-artifacts/7-2-hero-avant-apres.md` — story file

## Change Log

- 2026-07-12 : Implémentation Story 7.2 — hero avant/après en server component (LCP-first), CtaButton avec promesse « 15 min », pricing conservé, meta OG intactes. Anciennes animations (LightRays WebGL, ReactBits) retirées. build OK.
- 2026-07-13 : Images avant/après générées par Gemini (`gemini-2.5-flash-image`) — couple photoréaliste (text→image) + son STD (image→image, prompt produit) ; câblées dans le hero (placeholder supprimé). e2e **39/39** en environnement Docker (après pré-chauffage du cache `next/image` — l'optimiseur dev sature sous rafale concurrente d'images lourdes). Dépendances restantes : og-image.jpg, confirmation Lighthouse preview.
