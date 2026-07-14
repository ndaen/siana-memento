# Story 7.3: Scène Pinnée "Comment ça marche"

Status: ready-for-dev

<!-- Note: Validation optionnelle — run validate-create-story avant dev-story. -->
<!-- Story la plus risquée de l'Epic 7 (GSAP + perf). Le proposal conseille de la jouer EN DERNIER. -->

## Story

En tant que visiteur curieux,
je veux comprendre le processus à travers une scène animée au scroll,
afin d'être convaincu du parcours de création avant de commander.

## Acceptance Criteria

1. **Given** un visiteur scrollant la section "Comment ça marche"
   **When** il progresse
   **Then** une carte reste épinglée et se métamorphose sur 4 étapes (upload photo → génération IA → choix parmi 5 templates → livré), avec une progress-bar de progression

2. **Given** un utilisateur avec `prefers-reduced-motion` activé
   **When** il consulte la section
   **Then** un fallback statique équivalent est présenté sans animation (NFR-A)

3. **Given** la section animée (GSAP ScrollTrigger, chargé en différé)
   **When** j'exécute Lighthouse mobile
   **Then** LCP <2.5s et Perf ≥90 sont préservés (NFR-P2, NFR-P7)

## Décisions structurantes (à trancher avant implémentation)

- **D1 — Remplace la section how-it-works** (`#how-it-works` dans `page.tsx`, aujourd'hui une grille inline de **3** steps). ⚠️ **Conserver l'id `#how-it-works`** — `SiteHeader` (scroll-spy + `navLinks`) et `e2e/home.spec.ts` en dépendent. Nouveau composant client `siana/landing/HowItWorksPinned.tsx`.
- **D2 — 4 étapes** (l'epic passe de 3 à 4) : (1) upload photo → (2) génération IA → (3) choix parmi 5 templates → (4) livré par email. La carte reste **pinnée** et se métamorphose au scroll ; progress-bar de progression.
- **D3 — GSAP ScrollTrigger, chargé en différé.** `import` dynamique / `gsap.registerPlugin(ScrollTrigger)` **côté client uniquement**, via `useGSAP` (@gsap/react) `[architecture.md#527-529]`. Ne pas gonfler le bundle initial ni dégrader le LCP (le hero reste l'élément LCP).
- **D4 — `prefers-reduced-motion` = fallback statique RÉEL** via `gsap.matchMedia`. En reduced-motion : pas de pin, pas de scrub — les 4 étapes rendues empilées/en grille, toutes visibles, lisibles. Pattern déjà présent dans `HeroSection.tsx` (`gsap.matchMedia("(prefers-reduced-motion: no-preference)")`).
- **D5 — Pas de nouveau token/dépendance.** GSAP + @gsap/react déjà installés. `Eyebrow`/`Card`/`DecorativeMotif` (7.1) pour l'habillage ; charte Siana.
- **D6 — `will-change` maîtrisé, pas de layout thrashing** (animer transform/opacity, pas des propriétés de layout). Cf. skill `gsap-performance` / `gsap-scrolltrigger`.

## Tasks / Subtasks

- [ ] Task 1 — Composant scène pinnée (AC: 1)
  - [ ] `siana/landing/HowItWorksPinned.tsx` (client) : carte pinnée + progress-bar, métamorphose sur 4 étapes au scroll (ScrollTrigger `pin` + `scrub`)
  - [ ] Intégrer dans `page.tsx` en conservant `id="how-it-works"`
- [ ] Task 2 — Chargement différé de ScrollTrigger (AC: 3)
  - [ ] `registerPlugin` client-only / import dynamique ; vérifier que le bundle initial et le LCP ne régressent pas
- [ ] Task 3 — Fallback reduced-motion (AC: 2)
  - [ ] `gsap.matchMedia` : variante `(prefers-reduced-motion: reduce)` → 4 étapes statiques équivalentes, aucune animation ni pin
- [ ] Task 4 — Tests & perf (AC: 1, 2, 3)
  - [ ] Mettre à jour `e2e/home.spec.ts#20-24` : passer de 3 à 4 étapes, asserter les 4 libellés + `#how-it-works` visible
  - [ ] Lighthouse mobile : LCP <2.5s, Perf ≥90

## Dev Notes

### Stack & contexte (vérifié 2026-07-12)

- App `siana-memento-web/` — Next.js 16.1.6, App Router, React 19, Tailwind v4 (`globals.css @theme`), `font-display`/`font-body`, couleurs sémantiques. **Aucun nouveau token/font/dépendance ; pas de hex en dur.**
- Landing `src/app/page.tsx` (server, `force-dynamic`). How-it-works actuel : grille inline **3 steps** (`steps` array `[#48-67]`, `ScrollFloat` titre + `ScrollReveal`), `id="how-it-works"` `[#80-114]`.
- GSAP 3.14.2 + @gsap/react 2.1.2 **installés** ; utilisés dans `HeroSection.tsx` (`gsap.matchMedia` + timeline) — modèle à suivre. ScrollTrigger via le package `gsap` (`gsap/ScrollTrigger`).
- Primitives 7.1 : `Eyebrow`, `Card` (`rounded-3xl/4xl`), `DecorativeMotif`. ReactBits `ScrollFloat` (titre) réutilisable.

### GSAP — bonnes pratiques (skills disponibles)

- `gsap-scrolltrigger` (pin, scrub, triggers), `gsap-react` (`useGSAP`, cleanup au démontage), `gsap-core` (`gsap.matchMedia`, reduced-motion), `gsap-performance` (transforms only, `will-change`, éviter le thrashing). **Charger ScrollTrigger en différé** ; nettoyer les triggers au démontage (`useGSAP` scope).

### e2e à mettre à jour — `e2e/home.spec.ts#20-24`

Actuellement 3 steps : « Uploadez vos photos », « Choisissez votre style », « Recevez votre illustration ». Nouveau = **4 étapes** ; adapter les assertions (Playwright par défaut n'active pas reduced-motion → la version animée s'exécute ; asserter la présence des 4 libellés dans le DOM). Conserver l'id `#how-it-works` pour le test nav `#42`.

### Risque & garde-fous NFR

- **Risque perf n°1 de l'Epic 7.** ScrollTrigger différé, `will-change` ciblé, animation transform/opacity. LCP <2.5s (NFR-P2), Perf ≥90 (NFR-P7), `prefers-reduced-motion` obligatoire (NFR-A), clavier/focus préservés. Réflexe cache Turbopack (parsing error sur fichier intact → `touch` + redémarrer dev).

### Project Structure Notes

- Nouveau composant `siana/landing/HowItWorksPinned.tsx` (PascalCase, client), importé par `page.tsx`. Pas de barrel.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#525-530 — GSAP différé, prefers-reduced-motion, budget perf]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Patterns Landing Narratifs — scène pinnée 4 étapes]
- [Source: siana-memento-web/src/app/page.tsx#48-114 — how-it-works actuel à remplacer]
- [Source: siana-memento-web/src/components/siana/landing/HeroSection.tsx — pattern gsap.matchMedia]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
