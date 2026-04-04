# Story 5.2: Galerie d'Exemples et Section "Comment ça marche"

Status: review

## Story

En tant que visiteur curieux,
je veux voir des exemples de designs générés et comprendre le processus en 3 étapes,
afin d'être convaincu de la qualité du résultat avant de passer commande.

## Acceptance Criteria

1. **Given** un visiteur scrollant la landing page
   **When** il atteint la section galerie
   **Then** il voit au moins 3 exemples de designs générés (un par style) avec des légendes illustrant des couples fictifs

2. **Given** la section "Comment ça marche"
   **When** le visiteur la consulte
   **Then** il voit 3 étapes illustrées : "Uploadez vos photos", "Choisissez votre style", "Recevez votre illustration en 15 min"

3. **Given** le contenu textuel de la landing page
   **When** j'analyse le HTML
   **Then** la page contient au moins 300 mots de texte indexable (titres H2, étapes, FAQ) pour le référencement naturel (NFR-P7)

## Tasks / Subtasks

### Restructuration page.tsx

- [x] Task 1 : Restructurer le main pour supporter le scroll (AC: #1, #2)
  - [x] Transformer le `<main>` de centré-vertical fullscreen en layout scrollable
  - [x] Isoler le hero dans une `<section>` dédiée (conserve min-h-screen et centrage)
  - [x] Supprimer le `<ol>` basique des 3 étapes (remplacé par section complète)
  - [x] Changer le `<h2>` du pricing en `<span>` (pas un vrai heading)

### Section "Comment ça marche"

- [x] Task 2 : Créer la section "Comment ça marche" (AC: #2)
  - [x] `<section aria-labelledby="how-it-works-heading">` avec `<h2>`
  - [x] Grille 3 colonnes (sm:grid-cols-3) avec icônes lucide-react (Camera, Palette, Sparkles)
  - [x] Chaque étape : icône + numéro + titre `<h3>` + description détaillée
  - [x] Descriptions enrichies pour le SEO (contenu textuel substantiel)

### Section galerie d'exemples

- [x] Task 3 : Créer la galerie des 5 templates (AC: #1)
  - [x] `<section aria-labelledby="gallery-heading">` avec `<h2>` "Des styles pour chaque histoire"
  - [x] Paragraphe descriptif pour le SEO
  - [x] Grille responsive : 1 col mobile, 2 cols sm, 3 cols lg
  - [x] 5 cards (article) : placeholder coloré aspect 3:4, nom couple fictif, template, description
  - [x] Couleurs placeholders : Bohème #C17A6F, Moderne #1a1a1a, Classique #800020, Vintage #A67C52, Minimaliste #E8DCD4
  - [x] Hover effect subtil (shadow transition)

### CTA secondaire et SEO

- [x] Task 4 : Ajouter un CTA secondaire en bas de page (AC: #3)
  - [x] Section avec H2, description, et bouton "Commencer maintenant" → /generate/upload
  - [x] Texte supplémentaire pour atteindre 300+ mots indexables

### Validation

- [x] Task 5 : Vérifications techniques
  - [x] `npx tsc --noEmit` — zéro erreur TypeScript
  - [x] `npm run build` — build réussi
  - [x] Word count : 1019 mots (>>300 requis)
  - [x] Accessibilité : sections avec aria-labelledby, h2/h3 hiérarchie, aria-hidden sur décoratifs

## Dev Notes

### Ce qui a changé

- `<main>` : supprimé le centrage vertical `flex justify-center` et `min-h-[calc(100vh-80px)]` du main, déplacé dans une section hero dédiée
- `<ol>` basique 3 étapes : SUPPRIMÉ, remplacé par section complète avec icônes et descriptions
- `<h2>` pricing : changé en `<span>` (le prix n'est pas un heading sémantique)
- Ajout de 3 nouvelles sections : "Comment ça marche", galerie, CTA secondaire

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.2]
- [Source: docs/template-design-specs.md] — couleurs des 5 templates
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-P7] — 300 mots indexables
- [Source: siana-memento-web/src/app/page.tsx] — page après story 5-1

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Task 1: Restructured main from centered fullscreen to scrollable layout. Hero isolated in own section.
- Task 2: "Comment ça marche" section with 3-column grid, lucide icons, detailed descriptions for SEO.
- Task 3: Gallery section with 5 template cards, colored placeholders (aspect 3:4), couple names, descriptions.
- Task 4: Secondary CTA section with H2 and descriptive text. Total word count: 1019.
- Task 5: tsc clean, build passes, 1019 words (>>300), accessibility validated.

### File List
- `siana-memento-web/src/app/page.tsx` — restructured with gallery + how-it-works sections
