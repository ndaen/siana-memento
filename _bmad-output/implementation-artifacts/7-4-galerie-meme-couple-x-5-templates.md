---
baseline_commit: f7167756b0612d18c46171713514f71a2cb223b2
---

# Story 7.4: Galerie "Même Couple × 5 Templates"

Status: done

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
  - [x] `e2e/home.spec.ts` inchangé **en Tasks 1-3** (5 `<article>` conservés, `#gallery` visible) — suite complète **39/39** verte. ⚠️ Le fichier **a été modifié en Task 5** (scope `#hero` + 2 tests `?style=`) : voir File List.
- [x] Task 4 — Intégration assets (AC: 1)
  - [x] 5 assets « même couple × 5 templates » générés via le pipeline produit réel (`scripts/generate_gallery_assets.ts`, photo de référence = `hero-couple-v2.png`, couple aligné sur le hero : Camille & Hugo / 14 juin 2026 / Provence)
  - [x] Swap des placeholders → `/home/gallery-{template}.png`, TODO(assets) retiré, 5 anciennes images orphelines supprimées (−38 Mo)
- [x] Task 5 — Refonte du layout après revue d'Aldo (AC: 1) — *ajoutée post-review, cf. Change Log*
  - [x] Consultation de 4 avis design (skills `ui-ux-pro-max`, `design-taste-frontend`, `bmad-agent-ux-designer`, agent `opus-conseil`) — verdict unanime contre le carousel demandé, synthèse arbitrée par Aldo
  - [x] Layout hybride responsive, un seul markup : rail `scroll-snap` CSS natif en mobile/tablette (avec *peek* du voisin), grille `grid-cols-6` asymétrique 2 grandes + 3 petites en desktop → aucune ligne à trou. Zéro JS, zéro dépendance
  - [x] CTA : 5 boutons `outline` par style avec `?style=<id>` + 1 seul CTA primaire en clôture de section
  - [x] `?style=` lu et **validé** sur `/generate/upload` → `setTemplate()` (2 tests e2e : nominal + param invalide)
  - [x] Palette nommée (`<ul>` pastille + libellé) : a11y + SEO — section à **390 mots** (357 avant). Le `<dl>` initial était mal formé (`<dd>` avant `<dt>`) → corrigé en review
  - [x] `aspect-[27/37]` sur la galerie (ratio natif des assets) ; passe-partout `p-4 pb-6` (rehaussement optique)
  - [x] Fix a11y transverse : `ScrollFloat` ignorait `id` → **les 4 `aria-labelledby` de la landing étaient orphelins**. ⚠️ Rectification (code review) : la prop avait bien été ajoutée mais câblée **sur la seule galerie** — les 3 autres sections sont restées orphelines jusqu'au patch de review. Les 4 sont désormais réellement câblées (`page.tsx:51,92,136` + `Gallery.tsx:87`)

### Review Findings (code review 2026-07-14 — Blind Hunter + Edge Case Hunter + Acceptance Auditor)

- [x] [Review][Decision] **Dérive d'identité du couple entre les 5 assets** — AC1 « le même couple » est tenu sur l'intention (même photo de référence, mêmes noms) mais fragile à l'œil. Photo source : homme châtain, **lunettes sur la tête**, barbe de 3 jours ; femme blonde **frisée**. Bohème/Classique/Vintage rendent une barbe fournie sans lunettes et des cheveux lisses ; Moderne met cheveux et barbe **noirs** ; **Minimaliste est le seul fidèle** (lunettes, frisés, téléphone du selfie) → c'est l'outlier des 5. Un visiteur en lecture comparative — l'objet même de la story — voit 4 posters d'un couple + 1 d'un autre. Options : regénérer les outliers (~0,40 €/essai, taux de réussite ~45 %), accepter, ou changer de photo de référence.
- [x] [Review][Decision] **Les descriptions promettent autre chose que les visuels** — Classique (`Gallery.tsx:51`) annonce « portrait **dessiné au crayon** […] **monogramme doré** » : l'asset est une illustration peinte, sans crayonné ni monogramme. Minimaliste (`:75`) annonce « **aucune fioriture**, juste un **large espace blanc** » : l'asset a un décor complet (lavande, collines, cyprès). Vintage (`:63`) annonce « couverture de magazine » + « grain photographique » : absents. La copy suit `docs/template-design-specs.md`, les assets non. Sur une section dont le but est de prouver le rendu réel, le texte contredit l'image juste au-dessus. Options : réécrire la copy d'après les assets (gratuit, mais s'éloigne des specs templates), ou regénérer les assets pour coller aux specs (coûteux, incertain).
- [x] [Review][Decision] **Assets sous-résolus sur écrans retina (2 grandes cartes)** — les PNG font 864 px de large ; en desktop `max-w-6xl`/`grid-cols-6`, une carte *featured* affiche l'image à ~504 px CSS → ~1008 px requis en DPR 2. `next/image` ne suragrandit pas : rendu à ~86 % de la résolution idéale, légèrement mou. Gemini sort nativement en 864×1184, donc pas de correctif gratuit. Les 3 petites cartes (~315 px CSS) ne sont pas concernées. Options : accepter, réduire la largeur d'affichage des *featured*, ou upscaler les assets.
- [x] [Review][Patch] Fix a11y `ScrollFloat` appliqué à 1 section sur 4 — les 3 autres `aria-labelledby` restent orphelins (la story affirme l'inverse) [src/app/page.tsx:51,92,136]
- [x] [Review][Patch] `?style=` écrase silencieusement le template choisi au retour navigateur (et remet `selectedPalette` à `null`) [src/components/siana/UploadZone.tsx:43-47]
- [x] [Review][Patch] `<dl>` mal formé : `<dd>` rendu avant `<dt>`, et le seul `<dd>` est `aria-hidden` → balisage invalide, gain a11y revendiqué inexistant [src/components/siana/landing/Gallery.tsx:148-158]
- [x] [Review][Patch] `animate-bounce` en boucle infinie sans garde `prefers-reduced-motion` (WCAG 2.2.2, niveau AA) [src/components/siana/landing/HeroSection.tsx:86]
- [x] [Review][Patch] Test « unknown style » = faux négatif : lit `localStorage` sans `expect.poll`, avant hydratation → passe au vert même si la validation est supprimée [siana-memento-web/e2e/home.spec.ts:52-61]
- [x] [Review][Patch] Affirmations fausses dans la story (mémoire projet) : hero « non modifié », Task 3 « e2e inchangé », fix a11y « les 4 `aria-labelledby` » [ce fichier]
- [x] [Review][Patch] Cartes sans `<h3>` : le nom du template est un `<p>` via `Eyebrow` → plan de document aplati (`Eyebrow` supporte déjà `asChild`) [src/components/siana/landing/Gallery.tsx:142]
- [x] [Review][Patch] Commentaire d'usage du script en kebab-case alors que le fichier est en snake_case → `ERR_MODULE_NOT_FOUND` au copier-coller [siana-memento-api/scripts/generate_gallery_assets.ts:24]
- [x] [Review][Patch] `sizes` : `(max-width: 1024px)` matche à 1024 px pile alors que `lg:` (min-width 1024px) a déjà basculé en grille [src/components/siana/landing/Gallery.tsx:134-135]
- [x] [Review][Patch] `GlareHover.tsx` est du code mort depuis le retrait de son unique consommateur [src/components/GlareHover.tsx]
- [x] [Review][Patch] Double annonce lecteur d'écran : `aria-label` de l'`<article>` + `alt` de l'image disent la même chose, 5 fois [src/components/siana/landing/Gallery.tsx:116,129]
- [x] [Review][Defer] 9,2 Mo de PNG bruts committés — jamais affichés au-delà de ~536 px ; downscale/webp réduirait repo, build et flakiness e2e [siana-memento-web/public/home/gallery-*.png] — deferred, optimisation d'assets hors périmètre
- [x] [Review][Defer] Labels de palette non fidèles aux specs : `bg-nude` = « Beige » (Vintage) et « Nude » (Minimaliste) ; `bg-ice-white` = « Blanc » là où le spec dit Crème [src/components/siana/landing/Gallery.tsx:59,70,71] — deferred, cosmétique, D5 (pas de hex) reste tenu
- [x] [Review][Defer] Dev Notes décrivent `Card` comme `rounded-3xl/4xl` : la primitive réelle est le shadcn par défaut `rounded-xl`, c'est `Gallery.tsx:122` qui force le rayon [ce fichier] — deferred, doc mineure

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

Claude Sonnet 5 (Tasks 1-3) — Claude Opus 4.8 (Task 4)

### Debug Log References

Aucun blocage technique. `tsc` + `eslint` clean, e2e complet 39/39 après restart + purge cache `next/image` (conteneur `siana_web`).

Task 4 : aucun blocage technique non plus (pipeline appelable hors web sans DB/Cloudinary, seule `GEMINI_API_KEY` requise), mais **blocage qualité** — 11 générations pour 5 assets exploitables, cf. Completion Notes + Follow-up. Cache `next/image` pré-chauffé en curl séquentiel sur les 5 nouveaux assets avant l'e2e (réflexe documenté en mémoire projet), puis 39/39 vert. Rendu vérifié au navigateur (screenshot section `#gallery`).

### Completion Notes List

- Nouveau composant `Gallery.tsx` (server component), remplace l'ancienne section galerie de `page.tsx` (5 couples différents, `GlareHover`). `GlareHover` laissé dans le repo (composant vendored partagé, potentiellement réutilisable ailleurs) mais n'a plus d'appelant.
- Présentation « œuvre encadrée » : `Card rounded-3xl` + marge interne (padding) formant un cadre/mat autour de l'image, bordure + `shadow-sm` (pas de `DecorativeMotif` — retiré du hero sur demande explicite d'Aldo peu avant, jugé superflu ; non réintroduit ici).
- Copy SEO : prose descriptive par template basée sur `docs/template-design-specs.md` (identité/technique/palette), rendue server-side. Total mesuré **357 mots** dans la section (AC2 ≥300 ✓).
- Pastilles de palette (3 couleurs par template) via les tokens Tailwind `terracotta/cream/sage-green`, `deep-black/ice-white/gold`, `burgundy/cream/gold`, `ochre/nude/olive`, `nude/ice-white/taupe` — déjà enregistrés dans `globals.css` `@theme`, aucun hex en dur.
- **Task 4 complétée (2026-07-14) — AC1 pleinement satisfait.** Les 5 assets ont été générés via le **vrai pipeline produit** (`generateDesignImage`), pas maquettés à part : la galerie montre donc exactement ce que l'app produit. Photo de référence = `hero-couple-v2.png` (le couple du hero) et `weddingData` aligné sur le poster « après » du hero (Camille & Hugo, 14 juin 2026, Provence) → la galerie prolonge la narration du hero au lieu d'introduire un couple inconnu.
- Script réutilisable : `siana-memento-api/scripts/generate_gallery_assets.ts` (accepte des ids de template en argument pour regénérer un seul style). Conservé car la génération est une loterie (voir ci-dessous) — il resservira.
- Anciennes images (5 couples différents) supprimées : orphelines après le swap, **−38 Mo** dans le repo (galerie 38 Mo → 9,2 Mo). Aucune autre référence (vérifié par grep sur `src/` et `e2e/`).
- **⚠️ Constat qualité IA à remonter (hors périmètre 7.4, voir Follow-up) : 11 générations ont été nécessaires pour 5 assets exploitables (~45 % de réussite).** Deux modes d'échec observés, tous deux dus au prompt du service :
  1. **Collage photo** — sur les styles proches du photoréalisme (aquarelle, crayonné, **rotoscopie**), Gemini garde le selfie tel quel et n'illustre que le décor. Rendu incohérent (visages photo sur fond peint). Vintage a échoué 2×/3 — « rotoscope » (`generation_service.ts:122`) décrit littéralement une technique de décalque, ce qui pousse au photoréalisme.
  2. **Couple de dos** — `POSE_VARIATIONS` (`generation_service.ts:209-217`) contient `walking away together into the distance, seen from behind` (1 pose /7, tirée au hasard) : visages invisibles, le client ne se reconnaît pas.
  Les styles éloignés du réalisme (Moderne flat, Minimaliste line-art) ont réussi du 1ᵉʳ coup. Service **non modifié** (comportement produit hors périmètre de cette story).

### File List

- `siana-memento-web/src/components/siana/landing/Gallery.tsx` — NEW : composant galerie « œuvres encadrées » ; UPDATE (Task 4) : swap des 5 `image:` vers `/home/gallery-*.png`, TODO(assets) retiré ; UPDATE (Task 5) : layout hybride rail/grille 2+3, palette nommée, CTA `?style=`, `aspect-[27/37]`
- `siana-memento-web/src/components/ScrollFloat.tsx` — UPDATE (Task 5) : prop `id` posée sur le `<h2>` (fix a11y transverse — les 4 `aria-labelledby` de la landing étaient orphelins)
- `siana-memento-web/src/components/siana/landing/HeroSection.tsx` — UPDATE (Task 5) : `id="hero"` (permet de scoper le test du CTA hero). Ratio volontairement inchangé, cf. décisions Task 5. **UPDATE (Aldo, hors périmètre 7.4)** : hero passé en pleine hauteur (`min-h-svh flex flex-col justify-center`, `pb-16`→`pb-20`), `whitespace-nowrap` sur « par design », et ajout d'un lien d'ancrage `ChevronDown` vers `#how-it-works` — `motion-safe:` ajouté par la code review (WCAG 2.2.2)
- `siana-memento-web/src/app/page.tsx` — UPDATE (review) : `id` passé aux 3 `ScrollFloat` restants (`how-it-works-heading`, `testimonials-heading`, `cta-heading`)
- `siana-memento-web/src/components/GlareHover.tsx` — DELETED (review) : code mort depuis le retrait de son unique consommateur en Task 1
- `siana-memento-web/src/components/siana/UploadZone.tsx` — UPDATE (Task 5) : prop `initialStyle` + effect `setTemplate` (effect séparé du reset : `resetForPhotoChange` conserve `selectedTemplate`)
- `siana-memento-web/src/app/(public)/generate/upload/page.tsx` — UPDATE (Task 5) : lecture + validation de `?style=` (param non fiable → filtré contre `TEMPLATES`)
- `siana-memento-web/e2e/home.spec.ts` — UPDATE (Task 5) : scope du test hero sur `#hero` ; 2 tests ajoutés (`?style=` nominal + param invalide)
- `siana-memento-web/src/app/page.tsx` — UPDATE : remplace l'ancienne section galerie par `<Gallery />`, retire l'array `examples` et l'import `GlareHover`/`Image` devenus inutiles
- `siana-memento-api/scripts/generate_gallery_assets.ts` — NEW (Task 4) : génération one-shot des 5 assets via le pipeline produit
- `siana-memento-web/public/home/gallery-{boheme,moderne,classique,vintage,minimaliste}.png` — NEW (Task 4) : 5 assets « même couple », 864×1184
- `siana-memento-web/public/home/{sophie&thomas,lea&antoine,marie&hugo,camille&julien,emma&lucas}.png` — DELETED (Task 4) : orphelines après swap (−38 Mo)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — UPDATE : statut story
- `_bmad-output/implementation-artifacts/7-4-galerie-meme-couple-x-5-templates.md` — story file

### Task 5 — décisions et constats (2026-07-14)

- **Carousel écarté, sur avis unanime des 4 consultations.** La story exige de « constater la cohérence **et** la variété » = acte comparatif → exige la co-présence des rendus. Un carousel n'en montre qu'un, met les 4 autres derrière une interaction, et pousserait les 357 mots en `hidden` (indexés mais dévalués par Google → AC2 satisfait sur le papier, dégradé en réalité). Sally note qu'il aurait imposé une réécriture d'AC1 (donc un sprint-change) rendant la user story infaisable. **Le diagnostic d'Aldo était juste** (œuvres écrasées par leurs notices, trou 3+2 laid) ; ce qu'il décrivait — « image en grand d'un côté, détails de l'autre » — est un layout, pas un carousel.
- **Arbitrage retenu (Aldo) : hybride responsive.** Rail en mobile (la cible : geste natif, œuvre en grand, peek = affordance honnête), grille 2+3 en desktop (les 5 co-présentes → la comparaison reste possible là où la place existe). Un seul markup, uniquement des classes responsive → plus petit diff des options étudiées.
- **Constat : le trou 3+2 était un problème desktop uniquement** (mobile = déjà 1 colonne). Relevé par Sally et opus-conseil.
- **`ScrollReveal` + rail** : le piège (translate `y` sur les enfants d'un `overflow-x-auto` → scrollbar verticale parasite) est évité sans bricolage — `ScrollReveal.tsx:32` anime le wrapper quand il n'a qu'un enfant, donc le rail lui est passé en enfant unique.
- **Hero — rectification (code review).** La ligne « Hero non modifié (hors l'ajout d'`id="hero"`) » était exacte à l'écriture, mais Aldo a ensuite refondu le hero (pleine hauteur `min-h-svh`, flèche d'ancrage `ChevronDown`, `whitespace-nowrap`). Ces changements sont **hors périmètre 7.4** et non tracés dans les Tasks ; ils sont documentés en File List. Le `ratio` du hero, lui, reste bien inchangé et volontairement (voir ci-dessous).
- **Correctif `aspect-[27/37]` limité à la galerie.** Les experts supposaient que le hero partageait les assets 864×1184 : **faux, vérifié**. `hero-std-v2.png` = 896×1200 (0,747 vs 0,75 → écart 0,4 %, invisible) et `hero-couple-v2.png` = 768×1376 (0,558) est un **recadrage volontaire** en vignette polaroid — lui imposer son ratio natif donnerait une vignette haute et étroite. Hero non modifié (hors l'ajout d'`id="hero"`).
- **Régression e2e traitée à la racine.** Le CTA de clôture a fait échouer `hero section displays […] CTA` : le test cherchait le lien dans tout `#main-content` alors que son intention est le hero. Correctif = `id="hero"` + scope du test sur `#hero` → le test est **resserré**, pas affaibli.
- **Effet de bord assumé : `/generate/upload` passe de statique (○) à dynamique (ƒ)** — conséquence directe de la lecture de `searchParams`. Acceptable : page de tunnel, non SEO-critique, déjà interactive (la home est dynamique de toute façon). Alternative écartée : lecture client via `useSearchParams` + `Suspense` (plus de code pour un gain nul ici).
- **Hors périmètre, non corrigé, à signaler** : `ScrollFloat` découpe les titres **caractère par caractère**, donc la césure mobile tombe n'importe où (« Un couple, cinq interpr / étations »). Affecte tous les titres de la landing, pas seulement la galerie. Fix probable : découper par mot — à traiter dans une story dédiée (risque de régression sur toutes les sections).

## Follow-up proposé (hors périmètre 7.4)

**Qualité de génération — 45 % de réussite mesurée** (11 générations pour 5 assets). À arbitrer par Aldo, à rattacher au spike qualité IA existant. Deux pistes, toutes deux dans `generation_service.ts` :

1. **Retirer ou conditionner la pose « de dos »** (`POSE_VARIATIONS:209-217`). Un client qui ne voit pas son visage sur son Save the Date demandera une itération → coût Gemini + friction. Correctif à une ligne.
2. **Renforcer la consigne d'illustration** pour les styles réalistes : le prompt dit `based exactly on the provided reference photos` (`:234`), ce qui invite au décalque. Une consigne explicite du type « illustrer, ne jamais reproduire la photo telle quelle » devrait couper le mode « collage photo ». À valider par un test A/B sur les 3 styles concernés (Bohème, Classique, Vintage).

Impact business : chaque échec = une itération client (max 3 incluses) ou un remboursement, sur un produit à 19,90 € avec ~0,40 €/génération.

## Change Log

- 2026-07-14 : Implémentation Tasks 1-3 — composant `Gallery.tsx` (layout œuvres encadrées, copy SEO 357 mots, CTA par carte), intégré dans `page.tsx`. Images placeholder (5 couples différents existants). Task 4 (swap vers « même couple » réel) laissée ouverte — dépendance asset.
- 2026-07-14 : Code review (3 couches adversariales) — 3 décisions arbitrées par Aldo (dérive d'identité des assets : acceptée ; copy réécrite d'après les visuels réels ; résolution retina : acceptée à 86 %), **12 patchs appliqués**, 3 items différés (`deferred-work.md`). Correctifs notables : les 3 `aria-labelledby` restés orphelins (le fix Task 5 n'était câblé que sur la galerie — affirmation rectifiée), `?style=` qui écrasait le template au retour navigateur, `<dl>` invalide → `<ul>`, `motion-safe:` sur la flèche du hero, test `?style=` rendu discriminant, `GlareHover` (code mort) supprimé. Typecheck + ESLint clean sur les fichiers touchés, build prod 0 erreur, e2e **41/41**, AC2 à **390 mots**, 4/4 `aria-labelledby` vérifiés résolus dans le DOM. → done
- 2026-07-14 : Task 5 — refonte du layout après revue d'Aldo (grille 3+2 à trou rejetée). 4 consultations design → carousel écarté (casse la comparaison exigée par la story + dégrade AC2), arbitrage retenu : hybride rail mobile / grille 2+3 desktop. Inclus : CTA `?style=` (bug de promesse non tenue), palette nommée (a11y + SEO, 377 mots), `aspect-[27/37]`, fix a11y `ScrollFloat` (4 `aria-labelledby` orphelins). Typecheck + ESLint clean, build prod 0 erreur, e2e **41/41** (2 tests ajoutés), rendu vérifié desktop + mobile.
- 2026-07-14 : Task 4 — dépendance asset levée. 5 assets « même couple × 5 templates » générés via le pipeline produit et intégrés, anciennes images supprimées (−38 Mo). Typecheck + ESLint clean, e2e **39/39** vert, rendu vérifié au navigateur. Story complète, AC1 + AC2 satisfaits → review. Constat qualité IA (45 % de réussite) documenté en Follow-up.
