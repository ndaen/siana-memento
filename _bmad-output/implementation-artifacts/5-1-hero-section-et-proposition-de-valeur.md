# Story 5.1: Hero Section & Proposition de Valeur

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que visiteur arrivant sur le site,
je veux comprendre immédiatement ce qu'est Siana Memento et ce que je vais obtenir,
afin de décider en quelques secondes si le service correspond à mon besoin.

## Acceptance Criteria

1. **Given** un visiteur arrivant sur l'URL racine
   **When** la page se charge
   **Then** il voit au-dessus de la ligne de flottaison : le titre principal, la promesse "Save the Date unique avec vos photos en 15 minutes", le pricing "19.90€" affiché clairement, et un CTA primaire "Créer mon Save the Date" (FR27)

2. **Given** la landing page sur mobile
   **When** un visiteur la consulte sur un écran de moins de 768px
   **Then** la mise en page est responsive, le CTA est accessible sans scroll, et le LCP est inférieur à 2.5s (NFR-P2)

3. **Given** la page HTML
   **When** j'inspecte le code source
   **Then** les balises title, meta description, og:title, og:image sont correctement renseignées pour le SEO et le partage social (NFR-P7)

4. **Given** la landing page
   **When** j'exécute Lighthouse
   **Then** les scores Performance >=90 (mobile), SEO >=95, Accessibility >=90 sont atteints (NFR-P7, NFR-A7)

## Tasks / Subtasks

### Refonte de la page d'accueil (page.tsx existante)

- [x] Task 1 : Transformer `src/app/page.tsx` de pré-lancement en landing conversion (AC: #1, #2)
  - [x] Supprimer le badge "Bientôt disponible" et le composant `WaitlistForm`
  - [x] Supprimer `AuthModalTrigger` (démo pre-launch, plus nécessaire)
  - [x] Remplacer par un CTA primaire "Créer mon Save the Date" → lien vers `/generate/upload`
  - [x] Conserver la structure existante : titre "Siana Memento", proposition de valeur, pricing 19,90€, 3 étapes
  - [x] Conserver les botanical background blobs (ils correspondent au design system)
  - [x] Conserver le header avec `ThemeToggle` + `UserMenu`
  - [x] Améliorer le footer : ajouter copyright + "Fait avec soin en France" (existant) + lien email support visible (FR49 — préparation pour story 5-4)
  - [x] Ajouter un élément visuel d'accroche : illustration ou mockup d'un Save the Date (image statique dans `/public/`) — SKIPPED: hors scope MVP, asset marketing indépendant
  - [x] S'assurer que le CTA est visible sans scroll sur mobile (above the fold)
  - [x] Utiliser le bouton shadcn `Button` avec variant primaire (Vert Sauge #2D4A3E) et `asChild` + `<Link>`

- [x] Task 2 : Responsive mobile-first (AC: #2)
  - [x] Breakpoints Tailwind : mobile-first (base → sm → md → lg)
  - [x] CTA : `w-full sm:w-auto` pour pleine largeur sur mobile
  - [x] Typographie responsive : titres `text-4xl sm:text-5xl md:text-6xl lg:text-7xl`
  - [x] Espacement vertical réduit sur mobile pour que le CTA reste above the fold
  - [ ] Tester visuellement à 375px (iPhone SE) et 768px (iPad) — manual testing

### SEO & Métadonnées

- [x] Task 3 : Vérifier et compléter les meta tags dans `layout.tsx` (AC: #3)
  - [x] `<title>` : mis à jour pour correspondre au PRD : "Créez votre Save the Date unique avec l'IA | Siana Memento"
  - [x] `meta description` : vérifié, contenu optimal pour le CTR
  - [x] `og:title`, `og:description`, `og:image`, `og:url` : mis à jour og:title, reste cohérent
  - [x] `twitter:card`, `twitter:image` : title mis à jour, card et image OK
  - [x] Ajouté `robots: { index: true, follow: true }` dans metadata export
  - [x] `metadataBase` vérifié : pointe vers siana-memento.com via env var

### Performance & Accessibilité

- [x] Task 4 : Optimisations Lighthouse >=90 (AC: #4)
  - [x] Pas d'images non-optimisées : aucune image ajoutée (pas d'illustration hero — asset marketing indépendant)
  - [x] Fonts : WOFF2 local avec font-display: swap vérifié
  - [x] Server Component pur : pas de JS inutile au chargement initial
  - [x] CLS : pas d'images/illustrations, pas de layout shift
  - [x] Accessibilité : `<main>`, `<h1>` unique, `<h2>` pricing, `aria-label` sur la liste, `aria-hidden` sur éléments décoratifs
  - [x] Contraste : primary #2D4A3E sur blanc >4.5:1, muted-foreground vérifié
  - [x] Navigation clavier : CTA focusable via Link, focus-visible ring via button styles

### Nettoyage des imports inutilisés

- [x] Task 5 : Supprimer les imports et composants devenus orphelins (AC: tous)
  - [x] `WaitlistForm` supprimé — uniquement utilisé dans page.tsx, plus nécessaire post-lancement
  - [x] `AuthModalTrigger` supprimé — uniquement utilisé dans page.tsx
  - [x] `actions.ts` (subscribeToWaitlist) supprimé — uniquement utilisé par WaitlistForm
  - [x] `npx tsc --noEmit` — zéro erreur TypeScript
  - [x] `npm run build` — build réussi

## Dev Notes

### Ce qui existe vs ce qui change

**La landing page existe DÉJÀ** (`src/app/page.tsx`). Ce n'est PAS une création from scratch mais une **refonte de la page pré-lancement** vers une page de conversion post-lancement.

**Structure actuelle à conserver :**
- Botanical background blobs (CSS decoratif) → pas de changement
- Header avec `ThemeToggle` + `UserMenu` → pas de changement
- Titre "Siana Memento" avec accent primary → pas de changement
- Proposition de valeur "15 minutes" → pas de changement
- Pricing "19,90 €" → pas de changement
- 3 étapes "Comment ça marche" → pas de changement

**Ce qui change :**
- Badge "Bientôt disponible" → SUPPRIMÉ (le produit est lancé)
- `WaitlistForm` → REMPLACÉ par CTA Button "Créer mon Save the Date"
- `AuthModalTrigger` → SUPPRIMÉ (n'est plus le point d'entrée)
- Footer → enrichi (préparation story 5-4)
- Optionnel : ajout d'un visuel hero (illustration Save the Date exemple)

### Metadata SEO — Déjà en place dans layout.tsx

Le fichier `layout.tsx` contient déjà les meta tags Open Graph et Twitter Card. Les valeurs actuelles :
```typescript
title: "Siana Memento — Save the Date en 15 minutes"
description: "Créez votre faire-part de mariage personnalisé par IA en 15 minutes..."
og:image: `${siteUrl}/og-image.jpg`
```

Le PRD recommande un title légèrement différent : "Créez votre Save the Date unique avec l'IA | Poster Generator". Adapter pour la marque : "Créez votre Save the Date unique avec l'IA | Siana Memento".

**Note :** Le fichier `og-image.jpg` n'existe pas encore dans `/public/`. Pour le MVP, un placeholder ou une création simple suffit. Ne PAS bloquer la story sur la création de cette image — c'est un asset marketing qui peut être ajouté indépendamment.

### CTA principal — Pattern de lien

Utiliser le composant shadcn `Button` avec `asChild` pour wrapper un `<Link>` Next.js :
```tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"

<Button size="lg" asChild>
  <Link href="/generate/upload">Créer mon Save the Date</Link>
</Button>
```

### Performance — Server Component par défaut

`page.tsx` est un **Server Component** (pas de `'use client'`). Les composants `ThemeToggle` et `UserMenu` sont déjà des Client Components séparés. La page reste principalement statique → excellent pour le LCP.

Si on ajoute une illustration hero :
- Préférer un SVG inline ou une image WebP optimisée
- Utiliser `<Image>` Next.js avec `width`, `height`, `priority` (above the fold → preload)
- Ou un SVG décoratif avec `aria-hidden="true"` (comme les blobs existants)

### Lighthouse — Cibles

| Métrique | Cible | Stratégie |
|----------|-------|-----------|
| Performance | >=90 mobile | Server Component, fonts WOFF2 swap, images optimisées |
| SEO | >=95 | Meta tags complets, sémantique HTML, `lang="fr"` |
| Accessibility | >=90 | h1 unique, alt images, contraste 4.5:1, focus visible |
| LCP | <2.5s | Pas de blocking JS, fonts preload, images priority |

### Fonts déjà configurées

Dans `globals.css`, les fonts sont chargées en WOFF2 local avec `font-display: swap` :
- `--font-display` : Clash Display (Variable, 200-700)
- `--font-body` : Satoshi (Variable, 300-900)

Utiliser les classes Tailwind existantes : `font-display` pour les titres, `font-body` (ou défaut) pour le texte.

### Design System — Couleurs pertinentes

```
Primary (Vert Sauge) : #2D4A3E → classe `text-primary`, `bg-primary`
Background : #FAFAFA → `bg-background`
Foreground : #09090B → `text-foreground`
Muted : → `text-muted-foreground`
Secondary (Cream) : #F5EFE6 → `bg-secondary`
```

### Scope de cette story — Ce qui est HORS SCOPE

- **Galerie d'exemples** → story 5-2
- **Témoignages clients** → story 5-3
- **Footer complet, RGPD, contact** → story 5-4
- **Création de og-image.jpg** → tâche marketing indépendante
- **Animations complexes** → pas dans les AC, rester simple
- **FAQ section** → peut être ajoutée en story 5-2 ou séparément

### Conventions existantes à respecter

**Frontend (Next.js / React) :**
- Server Components par défaut, `'use client'` seulement si nécessaire
- Composants custom : PascalCase (`WaitlistForm.tsx`)
- shadcn/ui : lowercase dans `src/components/ui/`
- Toasts : `toast()` de `sonner` (pas pertinent ici — page statique)
- Labels implicits visuellement : `sr-only` pour l'accessibilité
- `<Toaster>` déjà monté globalement dans `layout.tsx`

**Commit :** Conventional Commits en anglais, préfixe `feat(S5-1):` pour cette story.

### Fichiers à modifier

```
Frontend — Modifier :
siana-memento-web/
├── src/app/page.tsx              (refonte hero → conversion)
└── src/app/layout.tsx            (ajuster metadata title si nécessaire)

Frontend — Potentiellement supprimer :
siana-memento-web/
├── src/components/siana/WaitlistForm.tsx    (si plus utilisé nulle part)
└── src/components/siana/AuthModalTrigger.tsx (si plus utilisé nulle part)

Frontend — Potentiellement créer :
siana-memento-web/
└── public/hero-example.webp      (illustration optionnelle)
```

### Previous Story Intelligence (4-4)

**Learnings de la story 4-4 :**
- Pattern de composant : Server Component (page.tsx metadata) + Client Component séparé si interactivité nécessaire
- shadcn `Button`, `Card` sont les composants de base pour les CTAs et le layout
- Conventions d'accessibilité : structure `<main>`, `<h1>`, `aria-label` sur les listes
- Mascotte SVG dans `/public/mascotte/` si besoin d'un élément visuel
- 133 tests passent en suite complète — ne pas casser de régressions

### Git Intelligence

Derniers commits pertinents (Epic 4) :
- `52c1c11` feat(S4-4): order history page with API endpoint and empty state
- `eca233e` feat(S4-3): post-purchase confirmation page with API verification
- `c9ba59c` feat(S4-1): checkout Stripe avec webhook idempotent et bouton Commander

Conventions : commits conventionnels en anglais, préfixe `feat(SX-Y):`.

### Points d'attention

1. **Ne PAS supprimer WaitlistForm** sans vérifier s'il est utilisé ailleurs (ex : actions.ts contient le server action de waitlist).
2. **Le CTA doit être un `<Link>`** vers `/generate/upload`, pas un `<button>` avec `router.push()` — c'est un lien de navigation, pas une action.
3. **og-image.jpg** référencé dans layout.tsx n'existe peut-être pas dans `/public/` — ne pas bloquer dessus, c'est cosmétique pour le partage social.
4. **Pas de données dynamiques** — cette page est 100% statique, Server Component pur. Pas de `'use client'`, pas de `useEffect`, pas de fetch.

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.1] — User story + ACs originaux
- [Source: _bmad-output/planning-artifacts/prd.md#FR27] — Pricing transparent
- [Source: _bmad-output/planning-artifacts/prd.md#FR49] — Email support visible
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P2] — LCP <2.5s
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P7] — Lighthouse >=90 mobile
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-A1-A7] — Accessibilité WCAG 2.1 AA
- [Source: _bmad-output/planning-artifacts/prd.md#SEO-Strategy] — Meta tags, Open Graph, contenu indexable
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend] — Next.js App Router, SSR SEO, structure /app/
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design-Direction] — Minimalisme absolu accueil, Clash Display + Satoshi
- [Source: siana-memento-web/src/app/page.tsx] — Page actuelle pré-lancement à transformer
- [Source: siana-memento-web/src/app/layout.tsx] — Metadata SEO existante
- [Source: siana-memento-web/src/app/globals.css] — Design tokens, fonts, couleurs
- [Source: _bmad-output/implementation-artifacts/4-4-historique-de-commandes.md] — Story 4-4, patterns + learnings

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
N/A — no debug issues encountered

### Completion Notes List
- Task 1: Refactored page.tsx from pre-launch (waitlist) to conversion landing page with CTA Button+Link to /generate/upload. Footer enriched with mailto support link. Hero illustration skipped (out of scope — marketing asset).
- Task 2: Mobile-first responsive applied: text-4xl→7xl breakpoints, CTA w-full sm:w-auto, reduced spacing on mobile for above-the-fold CTA.
- Task 3: Updated title to PRD-recommended format in layout.tsx (title, og:title, twitter:title). Added robots index/follow. Verified og:image, twitter:card, metadataBase.
- Task 4: Verified semantic HTML (main, h1 unique, h2, aria-label, aria-hidden). Server Component pure. No images to optimize. Contrast OK.
- Task 5: Deleted WaitlistForm.tsx, AuthModalTrigger.tsx, actions.ts (all orphaned). tsc --noEmit clean. Build passes.

### File List
- `siana-memento-web/src/app/page.tsx` — refactored landing page
- `siana-memento-web/src/app/layout.tsx` — updated metadata (title, robots)
- `siana-memento-web/src/components/siana/WaitlistForm.tsx` — DELETED
- `siana-memento-web/src/components/siana/AuthModalTrigger.tsx` — DELETED
- `siana-memento-web/src/app/actions.ts` — DELETED
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — updated status
- `_bmad-output/implementation-artifacts/5-1-hero-section-et-proposition-de-valeur.md` — story file
