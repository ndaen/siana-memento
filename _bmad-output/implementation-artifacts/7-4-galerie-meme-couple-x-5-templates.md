---
baseline_commit: f7167756b0612d18c46171713514f71a2cb223b2
---

# Story 7.4: Galerie "Même Couple × 5 Templates"

Status: in-progress

<!-- Note: Validation optionnelle — run validate-create-story avant dev-story. -->

## Story

En tant que visiteur hésitant,
je veux voir le même couple décliné dans les 5 styles,
afin de constater la cohérence et la variété du rendu IA.

## Acceptance Criteria

1. **Given** un visiteur atteignant la galerie
   **When** il la consulte
   **Then** il voit le même couple décliné dans les 5 templates (Bohème, Moderne, Classique, Vintage, Minimaliste), présentés comme des œuvres encadrées, chacun avec un CTA

2. **Given** le contenu textuel de la landing
   **When** j'analyse le HTML
   **Then** au moins 300 mots indexables sont présents pour le SEO (NFR-P7)

## Décisions structurantes (à trancher avant implémentation)

- **D1 — Remplace la section galerie** (`#gallery` dans `page.tsx`, aujourd'hui 5 couples **différents** en `GlareHover`). ⚠️ **Conserver l'id `#gallery`** (scroll-spy `SiteHeader` + `navLinks` + `e2e`).
- **D2 — BLOCKER ASSET : les images « même couple × 5 templates » n'existent pas.** Les 5 assets actuels (`public/home/*.png`) sont 5 couples différents (un par template). L'AC1 exige **un seul couple** décliné dans les 5 styles → 5 nouvelles images à produire (voir Dépendances). Stratégie : construire le layout + copy + CTA maintenant, avec les images actuelles comme **placeholders**, et swap quand les vrais assets arrivent. Marquer les placeholders (TODO visible).
- **D3 — Présentation « œuvres encadrées »** : `Card` (7.1, `rounded-3xl`) + cadre décoratif discret (bordure/ombre/`DecorativeMotif`), `Eyebrow` pour le nom du template, un `CtaButton` par œuvre (→ `/generate/upload`). `GlareHover` conservable ou remplacé selon le rendu.
- **D4 — ≥300 mots indexables (SEO)** : ajouter une **vraie prose descriptive** par template (rendue server-side, pas seulement des images) — style, palette, ambiance. Copy fournie ci-dessous (Dev Notes) à partir des specs templates. C'est un AC mesurable : compter les mots indexables du `<main>`.
- **D5 — Pas de nouveau token/dépendance ; charte Siana.**

## Tasks / Subtasks

- [x] Task 1 — Galerie encadrée 5 templates (AC: 1)
  - [x] Layout « œuvres encadrées » : nouveau composant `Gallery.tsx`, 5 `Card rounded-3xl` avec cadre (padding + bordure interne autour de l'image façon marie-louise), `Eyebrow` nom template, image (placeholder actuel), `CtaButton` par carte (`timePromise={null}`)
  - [x] `id="gallery"` conservé
- [x] Task 2 — Copy SEO ≥300 mots (AC: 2)
  - [x] Prose descriptive par template (5×~65 mots + intro), rendue server-side (composant server, pas de `"use client"`) — total mesuré **357 mots** dans la section
- [x] Task 3 — Tests (AC: 1)
  - [x] `e2e/home.spec.ts` inchangé (5 `<article>` conservés, `#gallery` visible) — suite complète **39/39** verte
- [ ] Task 4 — Intégration assets (AC: 1) — *dépend de la livraison des images (voir Dépendances)*
  - [ ] Swap des placeholders par les 5 images « même couple » quand disponibles

## Dev Notes

### Stack & contexte (vérifié 2026-07-12)

- App `siana-memento-web/` — Next.js 16.1.6, App Router, React 19, Tailwind v4. `font-display`/`font-body`, couleurs sémantiques + palette templates (`terracotta`, `cream`, `gold`, `burgundy`, `ochre`, `nude`, `taupe`, `olive`, `sage`). **Aucun nouveau token/font/dépendance ; pas de hex en dur.**
- Galerie actuelle : `examples` array `[page.tsx#15-46]` (5 couples différents), rendus en `GlareHover` `<article>` `aspect-[3/4]` `[#117-175]`. Images `public/home/*.png` (1792×2400).
- Primitives 7.1 : `Eyebrow`, `Card` (`rounded-3xl/4xl`), `CtaButton`, `DecorativeMotif`.

### Copy templates (source SEO — specs)

Décrire chaque template (≥300 mots au total sur la section). Base : `docs/template-design-specs.md` + `CLAUDE.md` :
- **Bohème** — aquarelle, Terracotta (#C17A6F) + Crème + Vert Sauge, composition asymétrique 55/45.
- **Moderne** — flat géométrique, Noir + Blanc + Or, centré minimal.
- **Classique** — crayonné, Bordeaux + Crème + Or, symétrique formel.
- **Vintage** — rotoscopie, Ocre + Beige + Olive, mise en page magazine années 70.
- **Minimaliste** — art une-ligne, Nude + Crème + Taupe, blanc absolu.

### e2e — `e2e/home.spec.ts#28-31`

Assertion actuelle : `#gallery` visible + `article` count = **5**. Garder 5 cartes → l'assertion tient ; sinon adapter le compte. Ne pas casser le test nav `#42` (id `#gallery`).

### Dépendances / prérequis (à signaler à Aldo)

- **5 images « même couple × 5 templates »** : n'existent pas. À générer via le pipeline IA (un couple, 5 styles) ou à produire. Sans elles, l'AC1 (« même couple ») n'est pas pleinement satisfait — la story livre le layout/copy/CTA avec placeholders, le swap est un sous-lot dépendant de la livraison assets.

### Garde-fous NFR

- SEO ≥95 & Perf ≥90 mobile (NFR-P7), LCP <2.5s (NFR-P2). Images `next/image` optimisées (dimensions, lazy sauf above-the-fold), alt descriptifs (SEO + a11y). WCAG AA, clavier/focus.

### Project Structure Notes

- Section galerie refondue dans `page.tsx` (ou composant `siana/landing/Gallery.tsx`). Pas de barrel, import via `@/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.4]
- [Source: docs/template-design-specs.md — specs visuelles des 5 templates]
- [Source: siana-memento-web/src/app/page.tsx#15-46,#117-175 — galerie actuelle à remplacer]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Patterns Landing Narratifs — galerie œuvres encadrées]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5

### Debug Log References

Aucun blocage technique. `tsc` + `eslint` clean, e2e complet 39/39 après restart + purge cache `next/image` (conteneur `siana_web`).

### Completion Notes List

- Nouveau composant `Gallery.tsx` (server component), remplace l'ancienne section galerie de `page.tsx` (5 couples différents, `GlareHover`). `GlareHover` laissé dans le repo (composant vendored partagé, potentiellement réutilisable ailleurs) mais n'a plus d'appelant.
- Présentation « œuvre encadrée » : `Card rounded-3xl` + marge interne (padding) formant un cadre/mat autour de l'image, bordure + `shadow-sm` (pas de `DecorativeMotif` — retiré du hero sur demande explicite d'Aldo peu avant, jugé superflu ; non réintroduit ici).
- Copy SEO : prose descriptive par template basée sur `docs/template-design-specs.md` (identité/technique/palette), rendue server-side. Total mesuré **357 mots** dans la section (AC2 ≥300 ✓).
- Pastilles de palette (3 couleurs par template) via les tokens Tailwind `terracotta/cream/sage-green`, `deep-black/ice-white/gold`, `burgundy/cream/gold`, `ochre/nude/olive`, `nude/ice-white/taupe` — déjà enregistrés dans `globals.css` `@theme`, aucun hex en dur.
- **Task 4 non complétée : AC1 (« même couple » dans les 5 styles) non pleinement satisfait.** Les 5 images utilisées sont les 5 couples différents déjà existants (un par template), en placeholder temporaire — TODO commenté en tête de `Gallery.tsx`. Blocage identique à la dépendance déjà rencontrée en story 7.2 (assets à générer). Voir Dépendances.

### File List

- `siana-memento-web/src/components/siana/landing/Gallery.tsx` — NEW : composant galerie « œuvres encadrées »
- `siana-memento-web/src/app/page.tsx` — UPDATE : remplace l'ancienne section galerie par `<Gallery />`, retire l'array `examples` et l'import `GlareHover`/`Image` devenus inutiles
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — UPDATE : statut story
- `_bmad-output/implementation-artifacts/7-4-galerie-meme-couple-x-5-templates.md` — story file

## Change Log

- 2026-07-14 : Implémentation Tasks 1-3 — composant `Gallery.tsx` (layout œuvres encadrées, copy SEO 357 mots, CTA par carte), intégré dans `page.tsx`. Images placeholder (5 couples différents existants). Task 4 (swap vers « même couple » réel) laissée ouverte — dépendance asset.
