# Story 5.4: Footer, Contact & Politique RGPD

Status: done

## Story

En tant que visiteur,
je veux trouver facilement les informations legales et les moyens de contact,
afin d'avoir confiance dans le service et ses engagements sur mes donnees.

## Acceptance Criteria

1. **Given** un visiteur consultant le footer
   **When** il le lit
   **Then** il voit l'adresse email de support (support@siana-memento.fr) clairement affichee (FR49)

2. **Given** un visiteur cliquant sur "Politique de confidentialite"
   **When** la page s'ouvre
   **Then** il peut lire la politique RGPD complete incluant : donnees collectees, duree de conservation des photos (7 jours), droits de l'utilisateur, et coordonnees du responsable de traitement (FR32)

3. **Given** un nouveau visiteur interagissant pour la premiere fois avec un formulaire
   **When** il consulte le formulaire
   **Then** un lien vers la politique de confidentialite est affiche avant la soumission (NFR-S8)

## Tasks / Subtasks

### Composant Footer

- [x] Task 1 : Creer le composant Footer (AC: #1)
  - [x] Logo Siana Memento avec font-display
  - [x] Email de support support@siana-memento.fr en lien mailto
  - [x] Liens navigation : Creer mon Save the Date, Politique de confidentialite
  - [x] Copyright 2026 Siana Memento
  - [x] Background Vert Sauge (#2D4A3E), texte blanc/creme
  - [x] Responsive : stack mobile, row desktop
  - [x] Accessible : liens avec focus visible, contraste >= 4.5:1

- [x] Task 2 : Integrer le Footer dans le layout (AC: #1)
  - [x] Importer Footer dans layout.tsx
  - [x] Placer apres {children} pour affichage sur toutes les pages
  - [x] Retirer le mini-footer existant de page.tsx

### Page Politique de confidentialite

- [x] Task 3 : Creer la page RGPD /privacy (AC: #2)
  - [x] Route (public)/privacy/page.tsx en Server Component
  - [x] Metadata SEO (title, description)
  - [x] Contenu complet en francais couvrant :
    - [x] Donnees collectees (photos, noms, email, date/lieu mariage)
    - [x] Conservation photos : 7 jours puis suppression automatique
    - [x] Conservation designs : 7 jours pour re-telechargement
    - [x] Droits utilisateur (acces, rectification, suppression, portabilite)
    - [x] Responsable de traitement : Siana Memento
    - [x] Contact : support@siana-memento.fr
  - [x] Typographie propre avec headings font-display et sections

### Validation

- [x] Task 4 : Verifications techniques
  - [x] `npx tsc --noEmit` — zero erreur TypeScript
  - [x] Server Components purs (pas de 'use client')

## Dev Notes

### Approche

- Footer en composant separe dans `components/siana/Footer.tsx`
- Le footer remplace le mini-footer existant dans page.tsx
- Integre dans layout.tsx pour apparaitre sur toutes les pages
- Page privacy en Server Component avec metadata pour SEO

### Design et layout

- Footer : bg-[#2D4A3E] (Vert Sauge), texte white/white avec opacite
- Responsive : colonne sur mobile, ligne sur desktop
- Liens : underline-offset-2 hover:text-white transition
- Page privacy : max-w-3xl mx-auto, prose-like spacing

### Conventions existantes a respecter

- **Headings** : tous les h2/h3 ont `font-display` (Clash Display)
- **Couleurs** : design tokens + couleur directe pour le footer (#2D4A3E)
- **Server Component** : pas de 'use client', pas de state, pas de hooks
- **Mobile-first** : breakpoints base -> sm -> lg

### Fichiers a modifier/creer

```
Frontend — Creer :
siana-memento-web/
├── src/components/siana/Footer.tsx          (composant footer)
└── src/app/(public)/privacy/page.tsx        (page politique RGPD)

Frontend — Modifier :
siana-memento-web/
├── src/app/layout.tsx                       (ajouter Footer)
└── src/app/page.tsx                         (retirer mini-footer)
```

### Previous Story Intelligence (5-3)

**Learnings de la story 5-3 :**
- Pattern section : `<section aria-labelledby="xxx-heading">` + `<h2 id="xxx-heading" className="font-display ...">`
- Server Component pur requis
- Tous les headings doivent avoir `font-display`
- Decoratifs avec `aria-hidden="true"`
- Stars accessibility pattern : `role="img"` + `aria-label`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.4] — User story + ACs originaux
- [Source: _bmad-output/planning-artifacts/prd.md#FR49] — Email support visible footer
- [Source: _bmad-output/planning-artifacts/prd.md#FR32] — Politique RGPD
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-S8] — Lien privacy avant formulaire
- [Source: siana-memento-web/src/app/page.tsx] — Page actuelle avec mini-footer
- [Source: _bmad-output/implementation-artifacts/5-3-temoignages-clients.md] — Patterns et learnings 5-3

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Task 1: Created Footer component with Sage Green background, logo, support email mailto link, navigation links, copyright. Responsive layout with flexbox.
- Task 2: Integrated Footer into layout.tsx after {children}. Removed inline mini-footer from page.tsx.
- Task 3: Created /privacy page as Server Component with full RGPD policy in French covering all required sections.
- Task 4: tsc clean, Server Components pure (no 'use client').

### File List
- `siana-memento-web/src/components/siana/Footer.tsx` — new footer component
- `siana-memento-web/src/app/(public)/privacy/page.tsx` — new privacy policy page
- `siana-memento-web/src/app/layout.tsx` — added Footer import
- `siana-memento-web/src/app/page.tsx` — removed inline mini-footer
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — updated status
- `_bmad-output/implementation-artifacts/5-4-footer-contact-et-politique-rgpd.md` — story file
