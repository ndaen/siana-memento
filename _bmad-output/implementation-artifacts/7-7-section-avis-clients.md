# Story 7.7: Section Avis Clients

Status: ready-for-dev

<!-- Note: Validation optionnelle — run validate-create-story avant dev-story. -->

## Story

En tant que visiteur hésitant,
je veux lire des avis de clients satisfaits,
afin de me rassurer avant d'acheter.

## Acceptance Criteria

1. **Given** des testimonials activés (gérés via Epic 6)
   **When** un visiteur consulte la section avis refondue
   **Then** les testimonials actifs s'affichent avec prénom et témoignage, dans le nouveau style (FR50)

2. **Given** aucun testimonial activé
   **When** la section est rendue
   **Then** elle est masquée proprement sans espace vide (raffine Story 5.3)

## Décisions structurantes (à trancher avant implémentation)

- **D1 — Refonte de la section témoignages** (`#testimonials` dans `page.tsx`). ⚠️ **Conserver l'id `#testimonials`** (scroll-spy `SiteHeader` + `navLinks` + `e2e`). **Restylage uniquement** — la couche données (fetch, modèle) ne change pas.
- **D2 — Données inchangées** : `getPublicTestimonials()` (server, `no-store`, `[]` si échec). Champs **camelCase** : `authorName`, `content`, `rating`. Le `rating` **existe** (étoiles remplies jusqu'à `rating`, ajouté en Epic 5/6 — ne pas le retirer). `authorName` = le prénom (FR50).
- **D3 — Nouveau style** : `Card` (7.1, `rounded-3xl`), `Eyebrow` (ex. « Avis clients »), `DecorativeMotif` optionnel, étoiles conservées. Charte Siana.
- **D4 — Masquage propre** : conserver le rendu conditionnel `testimonials.length > 0 && (...)` (déjà en place) → section absente si vide, aucun espace mort (AC2, raffine 5.3).
- **D5 — Pas de nouveau token/dépendance.**

## Tasks / Subtasks

- [ ] Task 1 — Restyle des cartes témoignages (AC: 1)
  - [ ] `Card rounded-3xl` + `Eyebrow` + `authorName` (prénom) + `content` + étoiles (`rating`), nouveau style Siana
  - [ ] Conserver `id="testimonials"`
- [ ] Task 2 — Masquage propre (AC: 2)
  - [ ] Conserver le rendu conditionnel `testimonials.length > 0` → aucune section ni espace si vide
- [ ] Task 3 — Tests (AC: 1, 2)
  - [ ] `e2e/home.spec.ts#35-38` : `#testimonials` visible + `article` count (dépend des données seedées — garder des `<article>`, adapter le compte si besoin) ; ne pas casser le test nav `#42`

## Dev Notes

### Stack & contexte (vérifié 2026-07-12)

- App `siana-memento-web/` — Next.js 16.1.6, App Router, React 19, Tailwind v4. `font-display`/`font-body`, couleurs sémantiques. Icône `Star` (lucide). **Aucun nouveau token/font/dépendance ; pas de hex en dur.**
- Section actuelle : `page.tsx#178-224`, conditionnelle `testimonials.length > 0 &&` `[#178]`, `<article>` cards, étoiles remplies `i < rating` `[#201-212]`, `blockquote` `content` `[#214-216]`, `authorName` `[#217-219]`.
- Données : `getPublicTestimonials()` `[src/lib/api/testimonials.ts#138]` → `PublicTestimonial[]` (`Pick<Testimonial,'id'|'authorName'|'content'|'rating'>` `[#20]`), `no-store`, `[]` si échec (dégradation gracieuse).
- Primitives 7.1 : `Eyebrow`, `Card` (`rounded-3xl/4xl`), `DecorativeMotif`.

### e2e — `e2e/home.spec.ts#35-38`

`#testimonials` visible + `article` count = **3** (dépend des données seed). Garder des `<article>` ; adapter le compte si le nombre seedé change. Conserver l'id pour le test nav `#42`.

### Note données (contexte Epic 6)

- Le `rating` par testimonial a été ajouté (git `5e7c19a` « add editable star rating », `4b2aa04 » note 1-5). Contrairement à d'anciennes notes, les étoiles ne sont **pas** hardcodées — elles reflètent `rating`. Conserver ce comportement.

### Garde-fous NFR

- Perf ≥90 / SEO ≥95 (NFR-P7), LCP <2.5s. WCAG AA : étoiles avec `role="img"` + label (déjà présent), contraste, clavier. Réflexe cache Turbopack.

### Project Structure Notes

- Section refondue dans `page.tsx` (ou composant `siana/landing/Testimonials.tsx`). Ne pas toucher `src/lib/api/testimonials.ts` ni le modèle. Pas de barrel, import via `@/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.7]
- [Source: siana-memento-web/src/app/page.tsx#178-224 — section témoignages actuelle]
- [Source: siana-memento-web/src/lib/api/testimonials.ts#20,#138 — getPublicTestimonials, PublicTestimonial]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Patterns Landing Narratifs]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
