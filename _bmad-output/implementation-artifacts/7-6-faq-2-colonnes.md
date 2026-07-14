# Story 7.6: FAQ 2 Colonnes

Status: ready-for-dev

<!-- Note: Validation optionnelle — run validate-create-story avant dev-story. -->

## Story

En tant que visiteur,
je veux trouver les réponses aux questions courantes,
afin de lever mes dernières hésitations avant d'acheter.

## Acceptance Criteria

1. **Given** un visiteur atteignant la FAQ
   **When** il la consulte
   **Then** il voit un titre géant sticky à gauche et un accordéon de questions à droite (contenu FAQ existant), responsive et accessible au clavier (NFR-A)

## Décisions structurantes (à trancher avant implémentation)

- **D1 — Section NOUVELLE.** ⚠️ **Le « contenu FAQ existant » évoqué par l'AC n'existe pas** — aucune paire Q/R n'a jamais été rédigée dans le code ou les docs. Le contenu est **fourni ci-dessous** (Dev Notes), rédigé à partir des faits produit ; le dev l'intègre tel quel (ou ajusté par Aldo).
- **D2 — Composant accordéon à ajouter.** shadcn `accordion` n'est pas encore dans `src/components/ui/`. L'ajouter (`npx shadcn@latest add accordion`) — c'est une primitive shadcn copiée (conforme à la convention), basée sur Radix Accordion, **accessible clavier nativement** (satisfait NFR-A). Le package `radix-ui` (unifié) est déjà installé → pas de nouvelle dépendance npm. Vérifier que l'import résout via `radix-ui`.
- **D3 — Layout 2 colonnes** : titre géant **sticky** à gauche (`position: sticky`, `font-display`, `Eyebrow` au-dessus), accordéon de questions à droite. Responsive → empilé sur mobile (titre non-sticky).
- **D4 — Pas de nouveau lien de nav** (garder le scope ; nav reste 3 ancres). Id de section optionnel (ex. `#faq`).
- **D5 — Pas de nouveau token ; charte Siana.**

## Tasks / Subtasks

- [ ] Task 1 — Primitive accordéon (AC: 1)
  - [ ] Ajouter `src/components/ui/accordion.tsx` (shadcn / Radix), vérifier l'accessibilité clavier
- [ ] Task 2 — Contenu FAQ (AC: 1)
  - [ ] Intégrer les 6 paires Q/R (voir Dev Notes) — server-rendered pour le SEO
- [ ] Task 3 — Layout 2 colonnes sticky (AC: 1)
  - [ ] Titre géant sticky à gauche + accordéon à droite ; responsive (empilé mobile)
- [ ] Task 4 — Tests & a11y (AC: 1)
  - [ ] Navigation clavier (ouvrir/fermer, focus visible) ; assertion e2e légère (section + une question) dans `home.spec.ts`

## Dev Notes

### Stack & contexte (vérifié 2026-07-12)

- App `siana-memento-web/` — Next.js 16.1.6, App Router, React 19, Tailwind v4. shadcn « new-york », Radix via package unifié `radix-ui` (`import { Accordion } from "radix-ui"`), helper `cn`. **Aucun nouveau token/font ; pas de hex en dur.**
- Landing `src/app/page.tsx` (server). Primitives 7.1 : `Eyebrow`, `Card`, `DecorativeMotif`.
- `src/components/ui/` contient déjà accordion ? **Non** (présents : alert, badge, button, card, checkbox, dialog, dropdown-menu, form, input, label, progress, select, sheet, skeleton, sonner, table, textarea). → ajouter `accordion.tsx`.

### Contenu FAQ (à intégrer — rédigé à partir des faits produit)

1. **Combien de temps pour recevoir mon Save the Date ?** — Environ 15 minutes : l'IA génère votre illustration, puis vous la recevez par email, prête à partager ou imprimer.
2. **Combien ça coûte ?** — 19,90 € par design, sans abonnement ni frais cachés.
3. **Quelle qualité de fichier je reçois ?** — Un fichier haute résolution 3000×4000 px, prêt à imprimer chez le professionnel de votre choix.
4. **Puis-je modifier le design ?** — Oui, jusqu'à 3 itérations sont incluses : vous nous indiquez vos retours et l'illustration est ajustée.
5. **Que deviennent mes photos ?** — Elles sont supprimées automatiquement après 7 jours (conformité RGPD). Votre design reste re-téléchargeable pendant 7 jours.
6. **Comment vous contacter ?** — Répondez simplement à l'email de confirmation, ou écrivez à support@siana-memento.fr.

*(Source des faits : `epics.md#1218`, `prd.md#340,#566`. Aldo peut ajuster le wording.)*

### Garde-fous NFR

- **NFR-A** : accordéon Radix (ARIA + clavier natifs), focus visibles, titre sticky sans piège de focus. WCAG AA. Perf ≥90 / SEO ≥95 (le contenu Q/R server-rendered aide le SEO). LCP <2.5s. Réflexe cache Turbopack.

### Project Structure Notes

- `ui/accordion.tsx` (kebab-case, shadcn). Section FAQ dans `page.tsx` ou composant `siana/landing/Faq.tsx`. Pas de barrel, import via `@/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.6]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Patterns Landing Narratifs — FAQ 2 colonnes titre sticky + accordéon]
- [Source: _bmad-output/planning-artifacts/prd.md#340,#566 — modèle support par email]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
