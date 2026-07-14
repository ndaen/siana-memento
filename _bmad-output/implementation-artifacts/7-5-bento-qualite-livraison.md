# Story 7.5: Bento Qualité / Livraison

Status: ready-for-dev

<!-- Note: Validation optionnelle — run validate-create-story avant dev-story. -->

## Story

En tant que visiteur,
je veux comprendre la qualité et les modalités de livraison,
afin d'être rassuré sur ce que je reçois.

## Acceptance Criteria

1. **Given** un visiteur atteignant la section qualité
   **When** il la consulte
   **Then** il voit une grille bento : grande image + cartes à icône avec eyebrow labels couvrant fichier haute résolution (3000×4000), délai (15 min), formats, et conservation RGPD (7 jours) (FR32)

## Décisions structurantes (à trancher avant implémentation)

- **D1 — Section NOUVELLE** (n'existe pas aujourd'hui). Insérer dans `page.tsx` (proposition : entre galerie et témoignages). Id de section optionnel (ex. `#qualite`).
- **D2 — PAS de nouveau lien de nav.** Ajouter un lien nav impliquerait de modifier `SiteHeader.navLinks` + le scroll-spy + `e2e/home.spec.ts`. Pour garder le scope minimal, la section est atteignable au scroll sans entrée de nav (nav reste 3 ancres).
- **D3 — Grille bento** : CSS grid, une grande tuile image (`Card rounded-4xl`) + cartes à icône (lucide) avec `Eyebrow` labels. Primitives 7.1 (`Card`, `Eyebrow`, `DecorativeMotif` optionnel). Charte Siana.
- **D4 — 4 items de contenu (FR32)** : fichier HD **3000×4000**, délai **15 min**, **formats** (PNG prêt à imprimer), conservation **RGPD 7 jours**.
- **D5 — Grande image** : réutiliser un asset de design (`public/home/*.png`) ou un crop détail. Pas d'animation requise (story faible risque).

## Tasks / Subtasks

- [ ] Task 1 — Grille bento (AC: 1)
  - [ ] Layout bento responsive : grande tuile image + 4 cartes à icône
  - [ ] Chaque carte : icône lucide + `Eyebrow` label + courte description
- [ ] Task 2 — Contenu qualité/livraison (AC: 1)
  - [ ] HD 3000×4000 · délai 15 min · formats · RGPD 7 jours
- [ ] Task 3 — Intégration & tests (AC: 1)
  - [ ] Insérer la section dans `page.tsx` ; responsive + a11y (contraste, sémantique, alt image)
  - [ ] Ajouter une assertion e2e légère (section + un libellé clé) dans `home.spec.ts`

## Dev Notes

### Stack & contexte (vérifié 2026-07-12)

- App `siana-memento-web/` — Next.js 16.1.6, App Router, React 19, Tailwind v4 (`globals.css @theme`), `font-display`/`font-body`, couleurs sémantiques. Icônes lucide-react. **Aucun nouveau token/font/dépendance ; pas de hex en dur.**
- Landing `src/app/page.tsx` (server, `force-dynamic`). Sections inline actuelles : hero, `#how-it-works`, `#gallery`, `#testimonials`, CTA secondaire. Footer via `layout.tsx`.
- Primitives 7.1 : `Card` (`rounded-3xl/4xl`), `Eyebrow` (petites capitales + `tracking-[0.2em]`), `DecorativeMotif`.
- `Card` base : `bg-card rounded-xl border py-6 shadow-sm` — surcharger en `rounded-4xl` pour la grande tuile.

### Contenu (source FR32)

- Fichier haute résolution **3000×4000** px, prêt à imprimer.
- Délai **15 minutes** (génération → livraison email).
- Formats livrés (PNG haute résolution).
- Conservation **RGPD** : ré-téléchargement pendant **7 jours**, photos supprimées après 7 jours.

### Garde-fous NFR

- LCP <2.5s (NFR-P2), Perf ≥90 / SEO ≥95 mobile (NFR-P7). Grande image `next/image` optimisée, lazy (hors above-the-fold), alt descriptif. WCAG AA (contraste `Eyebrow` `text-muted-foreground`, vérifier en dark), sémantique, clavier. Réflexe cache Turbopack.

### Project Structure Notes

- Section dans `page.tsx` ou composant `siana/landing/QualityBento.tsx`. Pas de barrel, import via `@/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Patterns Landing Narratifs — bento qualité à eyebrow labels]
- [Source: siana-memento-web/src/components/ui/card.tsx ; siana-memento-web/src/components/ui/eyebrow.tsx — primitives]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
