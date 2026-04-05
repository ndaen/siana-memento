# Story 5.3: Temoignages Clients

Status: done

## Story

En tant que visiteur hesitant,
je veux lire des avis de clients satisfaits,
afin de me rassurer sur la qualite du service avant d'acheter.

## Acceptance Criteria

1. **Given** des testimonials actives dans la base de donnees (geres via Epic 6)
   **When** un visiteur consulte la landing page
   **Then** les testimonials actifs s'affichent avec le prenom du client et son temoignage (FR50 — affichage lecture seule)

2. **Given** aucun testimonial active
   **When** la section est rendue
   **Then** elle est masquee proprement sans espace vide visible

## Tasks / Subtasks

### Section temoignages dans page.tsx

- [x] Task 1 : Creer les donnees hardcodees des temoignages (AC: #1)
  - [x] Tableau de 3 temoignages fictifs realistes (prenoms francais, contexte mariage)
  - [x] Structure : name, text (2-3 phrases), stars (5/5)
  - [x] Si le tableau est vide -> la section entiere ne s'affiche pas via `testimonials.length > 0` (AC: #2)

- [x] Task 2 : Creer la section temoignages (AC: #1, #2)
  - [x] Insere ENTRE la galerie d'exemples et le CTA secondaire dans page.tsx
  - [x] `<section aria-labelledby="testimonials-heading">` avec `<h2>` font-display
  - [x] Grille responsive : 1 col mobile, 2 cols sm, 3 cols lg
  - [x] Cards avec : prenom, blockquote du temoignage, etoiles (lucide Star fill-current)
  - [x] Style coherent avec les sections existantes (max-w-5xl, px-6 py-16 sm:py-24)

- [x] Task 3 : Accessibilite et SEO (AC: #1)
  - [x] Heading `<h2>` avec `font-display` (Clash Display)
  - [x] `aria-labelledby` sur la section
  - [x] Contraste texte via design tokens (text-foreground, text-muted-foreground)
  - [x] Texte des temoignages indexable (Server Component, contenu HTML statique)
  - [x] Stars decoratives avec `aria-hidden="true"`, rating en `sr-only`

### Validation

- [x] Task 4 : Verifications techniques
  - [x] `npx tsc --noEmit` — zero erreur TypeScript
  - [x] `npm run build` — build reussi
  - [x] Server Component pur (pas de 'use client')

## Dev Notes

### Approche MVP

L'Epic 6 (admin CRUD testimonials, story 6-6) n'est PAS encore implementee. Pour le MVP :
- Temoignages **hardcodes** directement dans le composant
- Quand 6-6 sera fait, on branchera sur l'API
- Si `testimonials.length === 0` -> `return null` (section masquee, AC #2)

### Position dans la page

La section doit s'inserer ENTRE la galerie d'exemples (`gallery-heading`) et le CTA secondaire (`cta-heading`) dans `page.tsx`. Ordre final :
1. Hero
2. Comment ca marche
3. Galerie d'exemples
4. **Temoignages clients** (nouveau)
5. CTA secondaire
6. Footer

### Donnees hardcodees suggerees

3-4 temoignages avec :
- Prenoms francais realistes (ex : Claire & Maxime, Manon & Romain, Julie & Alexandre)
- Contexte mariage (mention du style choisi, de la rapidite, de la qualite)
- 2-3 phrases par temoignage
- 5 etoiles pour chacun (MVP — pas de variation)

### Design et layout

- Meme pattern que les autres sections : `mx-auto max-w-5xl px-6 py-16 sm:py-24`
- Cards : `rounded-xl border border-border bg-card p-6`
- Etoiles : lucide `Star` en `fill-current text-primary` (petites, 4-5 icons)
- Prenom en `font-semibold text-foreground`, temoignage en `text-muted-foreground`
- Grille : `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`

### Conventions existantes a respecter

- **Headings** : tous les h2/h3 ont `font-display` (Clash Display) — OBLIGATOIRE
- **Couleurs** : utiliser les tokens Tailwind (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `text-primary`)
- **Server Component** : pas de `'use client'`, pas de state, pas de hooks
- **Mobile-first** : breakpoints `base -> sm -> lg`
- **Commit** : `feat(S5-3): testimonials section with hardcoded reviews`

### Fichiers a modifier

```
Frontend — Modifier :
siana-memento-web/
└── src/app/page.tsx    (ajouter section temoignages + import Star)
```

### Previous Story Intelligence (5-2)

**Learnings de la story 5-2 :**
- Pattern section : `<section aria-labelledby="xxx-heading">` + `<h2 id="xxx-heading" className="font-display ...">`
- Grille responsive : `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`
- Cards galerie : `rounded-xl border border-border bg-card shadow-sm`
- Max width sections : `max-w-5xl` ou `max-w-6xl` + `px-6 py-16 sm:py-24`
- Tous les headings doivent avoir `font-display` (review fix 5-2)
- Decoratifs avec `aria-hidden="true"`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.3] — User story + ACs originaux
- [Source: _bmad-output/planning-artifacts/prd.md#FR50] — Affichage temoignages lecture seule
- [Source: siana-memento-web/src/app/page.tsx] — Page actuelle apres story 5-2
- [Source: _bmad-output/implementation-artifacts/5-2-galerie-dexemples-et-section-comment-ca-marche.md] — Patterns et learnings 5-2
- [Source: _bmad-output/implementation-artifacts/5-1-hero-section-et-proposition-de-valeur.md] — Conventions landing page

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Task 1: Created 3 hardcoded testimonials with French couple names (Claire & Maxime, Manon & Romain, Julie & Alexandre), 2-3 sentence reviews mentioning specific template styles, 5 stars each.
- Task 2: Inserted testimonials section between gallery and CTA secondaire. Responsive grid (1/2/3 cols). Cards with blockquote, filled Star icons, and couple name.
- Task 3: aria-labelledby on section, font-display on h2, stars aria-hidden with sr-only rating text, design token colors for contrast.
- Task 4: tsc clean, build passes, Server Component pure (no 'use client').

### Review Notes
- Reviewed by Claude Opus 4.6 (1M context) on 2026-04-05
- All ACs verified: testimonials display correctly, empty state hides section
- Accessibility: role="img" with aria-label on star rating, aria-hidden on individual stars, font-display on h2, semantic blockquote
- Layout: correct position between gallery and CTA, responsive grid, design token colors
- TypeScript: tsc --noEmit clean for both frontend and backend
- Server Component: no 'use client', no hooks, no state
- No HIGH or MEDIUM issues found

### File List
- `siana-memento-web/src/app/page.tsx` — added testimonials data + section
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — updated status
- `_bmad-output/implementation-artifacts/5-3-temoignages-clients.md` — story file
