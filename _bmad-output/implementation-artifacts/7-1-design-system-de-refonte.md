---
baseline_commit: f4c179db4dfdbd10699e032c79efff54df2f07ea
---

# Story 7.1: Design System de Refonte

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created (2026-07-12) -->
<!-- Note: Validation optionnelle — run validate-create-story pour un contrôle qualité avant dev-story. -->

## Story

En tant que développeur,
je veux disposer des primitives visuelles partagées de la refonte,
afin que toutes les sections de la nouvelle landing soient cohérentes et rapides à assembler.

## Acceptance Criteria

1. **Given** le design system Siana existant (Sage Green, Clash Display, Satoshi)
   **When** je crée les primitives de refonte
   **Then** je dispose de : eyebrow labels (petites capitales + letter-spacing large), cartes à coins largement arrondis, nav pill sticky à fond flouté, CTA avec promesse de temps ("· 15 min"), et motifs décoratifs discrets — tous dans la charte Siana

2. **Given** ces primitives
   **When** je les intègre au thème
   **Then** elles réutilisent les tokens de couleur et typographie existants (aucune nouvelle palette, aucune nouvelle font)

## Décisions structurantes (lockées avant implémentation — pattern standard depuis retro Epic 6)

- **D1 — Emplacement :** primitive bas-niveau style shadcn → `src/components/ui/` (kebab-case, cva + `cn`, `data-slot`, export `{ Component, componentVariants }` comme `button.tsx`). Composites spécifiques landing → `src/components/siana/landing/` (PascalCase). Pas de barrel export (convention projet : aucun `index.ts`).
- **D2 — Zéro nouveau token :** aucune entrée ajoutée au bloc `@theme` de `globals.css`. Couleurs via tokens sémantiques (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-background`) ou brand (`sage-green`, `cream`…). Fonts via `font-display` / `font-body`. Radius via l'échelle existante (`rounded-3xl` / `rounded-4xl`, `--radius-4xl` déjà défini dans `globals.css:74`). Jamais de hex en dur.
- **D3 — Nav pill = refactor de `SiteHeader.tsx`, pas un nouveau composant.** Le header est déjà sticky avec `backdrop-blur-sm` au scroll ; on lui applique le traitement "pill" (conteneur arrondi flottant) en préservant tout le comportement existant (voir Dev Notes § Fichiers modifiés).
- **D4 — CTA temps = construit sur `ui/button.tsx`** (`buttonVariants`), pas sur ReactBits `StarBorder`. Composant composite `CtaButton` dans `siana/landing/` avec libellé + suffixe temps (`· 15 min`) stylé en opacité réduite. `StarBorder` reste en place sur la landing actuelle jusqu'à la story 7.2.
- **D5 — Showcase = `/design-system`** (`src/app/design-system/page.tsx`, style guide vivant existant) : chaque primitive y est ajoutée avec ses variantes. C'est la validation visuelle de la story — aucune section de la landing publique n'est modifiée dans 7.1.
- **D6 — Pas de GSAP dans cette story.** Les primitives sont statiques (CSS pur) ; les animations arrivent en 7.2/7.3. Motifs décoratifs = SVG inline `aria-hidden`, aucune lib (pas d'`ogl`, pas de canvas).

## Tasks / Subtasks

- [x] Task 1 — Primitive Eyebrow (AC: 1, 2)
  - [x] Créer `src/components/ui/eyebrow.tsx` : pattern cva minimal, base `text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground` (classe déjà éprouvée dans `design-system/page.tsx:34`), rendu `<p>` par défaut avec `asChild` (Slot de `radix-ui`) pour variantes sémantiques
  - [x] Variante optionnelle `accent` (`text-primary`) pour les eyebrows sur fond clair
- [x] Task 2 — Cartes à coins largement arrondis (AC: 1, 2)
  - [x] Ne PAS forker `ui/card.tsx` : la primitive est la composition `<Card className="rounded-3xl">` (ou `rounded-4xl` pour les grandes tuiles bento) — documenter ce pattern dans le showcase avec 2 exemples (carte icône + eyebrow, grande carte image)
- [x] Task 3 — Nav pill sticky à fond flouté (AC: 1, 2)
  - [x] Refactorer le rendu de `src/components/siana/SiteHeader.tsx` : à l'état `scrolled`, le contenu passe dans un conteneur pill (`rounded-full border border-border/40 bg-background/80 backdrop-blur-md shadow-sm`) flottant (marges latérales + `top` léger), au repos sur la home il reste transparent pleine largeur
  - [x] Préserver intégralement : scroll-spy IntersectionObserver, `navLinks` (mêmes hrefs/ids/labels), états auth (`getMe`, `UserMenu`, boutons Connexion/Inscription), CTA conditionnel au scroll, dropdown thème, `z-40`, transitions
  - [x] Vérifier le comportement hors home (pages `/generate/*`, `/admin` etc. : header non transparent — logique `isHome` conservée)
- [x] Task 4 — CTA avec promesse de temps (AC: 1, 2)
  - [x] Créer `src/components/siana/landing/CtaButton.tsx` : wrapper de `Button` (size `lg`, `rounded-full`), children = libellé, prop `timePromise` (défaut `"15 min"`) rendue en suffixe `· 15 min` (span `opacity-70`), `asChild`-compatible pour `<Link href="/generate/upload">`
- [x] Task 5 — Motifs décoratifs discrets (AC: 1, 2)
  - [x] Créer `src/components/siana/landing/DecorativeMotif.tsx` : 2-3 variantes de motifs botaniques SVG inline (rameau/feuille sage, dans l'esprit du logo), `aria-hidden="true"`, couleur via `currentColor` + classe `text-primary/10` (ou `text-sage/15`), positionnés en absolu par le parent
- [x] Task 6 — Showcase + validation (AC: 1, 2)
  - [x] Ajouter une section "Refonte Landing (Epic 7)" dans `src/app/design-system/page.tsx` montrant : Eyebrow (2 variantes), cartes arrondies (2 tailles), CtaButton, DecorativeMotif — la nav pill se valide sur la home en scrollant
  - [x] `npm run lint` + `npx tsc --noEmit` + build OK
  - [x] `npm run test:e2e -- home.spec.ts` vert (la nav garde hrefs/labels — aucune assertion à modifier ; si une assertion casse, corriger le composant, pas le test)

## Dev Notes

### Stack & contexte technique (vérifié dans le repo le 2026-07-12)

- **App :** `siana-memento-web/` — Next.js 16.1.6, App Router, React 19.2.3, TypeScript, alias `@/*` → `src/*`
- **Tailwind v4** : PAS de `tailwind.config.ts` — tout est dans `src/app/globals.css` via `@theme inline`. Tokens : `--color-sage-green: #2d4a3e`, palette templates (`terracotta`, `cream`, `gold`…), tokens shadcn sémantiques (`--primary: #2d4a3e` light / `#6baf8e` dark "Forêt Botanique"), `--radius: 0.75rem` avec échelle jusqu'à `--radius-4xl`
- **Fonts :** ClashDisplay + Satoshi en `@font-face` variable woff2 (`public/fonts/`), utilities `font-display` / `font-body`. ⚠️ Ne pas utiliser `font-sans` (token mort, leftover de template)
- **UI :** shadcn "new-york", Radix via package unifié `radix-ui` (`import { Slot } from "radix-ui"`), helper `cn` dans `src/lib/utils.ts`, icônes lucide-react
- **GSAP 3.14.2 + @gsap/react 2.1.2 déjà installés** (utilisés dans `HeroSection.tsx`) — rien à installer, et rien à en faire dans 7.1 (D6)
- **Dark mode obligatoire :** chaque primitive doit être correcte en light ET dark (tokens sémantiques garantissent ça — raison de plus pour D2)

### Fichiers modifiés (état actuel → à préserver)

- **`src/components/siana/SiteHeader.tsx`** (UPDATE — le seul fichier existant à comportement) : client component global (rendu dans `layout.tsx`, toutes les pages). État actuel : sticky `top-0 z-40 h-16`, transparent en haut de home, bascule à `scrollY > 20` vers `border-b bg-background/80 backdrop-blur-sm` ; nav ancres centrée en absolu (home uniquement, `sm:flex`) avec scroll-spy IntersectionObserver (`rootMargin: '-20% 0px -60% 0px'`) ; zone droite = skeleton pendant `getMe()`, puis `UserMenu` ou Connexion/Inscription + CTA (affiché seulement `!isHome || scrolled`) + dropdown thème. **La story ne change QUE l'habillage visuel (forme pill). Tout le reste est un contrat à ne pas casser** — y compris sur les pages non-home.
- **`src/app/design-system/page.tsx`** (UPDATE — additif) : style guide vivant avec helpers locaux `SectionTitle`/`SubTitle` et swatches ; ajouter la section Epic 7 en suivant sa structure existante.
- **NEW :** `src/components/ui/eyebrow.tsx`, `src/components/siana/landing/CtaButton.tsx`, `src/components/siana/landing/DecorativeMotif.tsx`.

### Anti-réinvention

- L'eyebrow existe déjà en inline à 6+ endroits (`design-system/page.tsx:34`, `ConfigForm.tsx:242`, `ResultView.tsx:433`, admin…) — la primitive centralise ce pattern, ne pas inventer un autre style. Ne PAS migrer les usages existants dans cette story (hors scope, les stories 7.2-7.7 consommeront la primitive).
- `Badge` (`ui/badge.tsx`, `rounded-full`) existe : l'eyebrow n'est pas un badge (pas de fond, pas de bordure) — composant distinct justifié.
- Le radius scale existe déjà : aucun token radius à ajouter.

### Garde-fous NFR (contrat Epic 7)

- **NFR-P2/P7 :** 7.1 n'ajoute aucun JS client significatif (SVG + CSS + un wrapper Button). `backdrop-blur-md` sur la nav est le seul coût rendu — déjà présent en `-sm`, acceptable. Aucune image, aucune lib.
- **NFR-A :** motifs décoratifs `aria-hidden` ; contrastes ≥4.5:1 pour tout texte (eyebrow `text-muted-foreground` sur `bg-background` : OK, vérifier en dark) ; focus visibles préservés sur nav/CTA ; touch targets ≥44px sur le CTA.
- La landing publique (`src/app/page.tsx`) n'est PAS touchée — Epic 5 reste en prod tel quel (seul le header, global, évolue visuellement).

### Testing

- **Playwright e2e uniquement** (pas de Vitest/Jest — ne pas en installer). Config : `playwright.config.ts`, `testDir: ./e2e`, chromium, webServer auto (`npm run dev`).
- `e2e/home.spec.ts` couvre la nav (hrefs des ancres) et les sections landing — doit rester vert sans modification. Learning Epic 5/6 : les assertions couplées au texte cassent quand la copy change ; ici on ne change aucune copy.
- Commandes : `npm run test:e2e`, `npm run lint`, `npm run dev`.
- ⚠️ Réflexe Turbopack (retro Epic 6) : parsing error sur fichier intact → `touch <fichier>` + redémarrer le dev server, c'est un cache, pas une vraie erreur.

### Project Structure Notes

- Conforme à la structure existante : `ui/` kebab-case pour primitives, `siana/landing/` PascalCase pour composites landing, imports directs via `@/` sans barrel.
- Variante détectée : la story 7.1 est la première à toucher le header global depuis Epic 5 — la forme pill s'applique à toutes les pages (générateur, admin). C'est voulu (cohérence), mais vérifier visuellement une page admin et une page generate après refactor.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7 / Story 7.1]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-07-12.md — décision charte Siana + patterns thelma.pet, ordre 7.1 en socle]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Patterns Landing Narratifs — finitions transverses : coins arrondis, nav pill, CTA temps, motifs discrets]
- [Source: _bmad-output/planning-artifacts/architecture.md:525-530 — note GSAP différé, prefers-reduced-motion, budget perf]
- [Source: siana-memento-web/src/app/globals.css — tokens @theme, radius scale, fonts]
- [Source: siana-memento-web/src/components/ui/button.tsx — pattern cva de référence]
- [Source: _bmad-output/implementation-artifacts/epic-6-retro-2026-06-04.md — pattern Décisions structurantes, réflexe Turbopack]

### Review Findings

Code review adversariale (Blind Hunter + Edge Case Hunter + Acceptance Auditor), 2026-07-12. 14 findings bruts → 9 retenus (dédupliqués), 9 écartés comme bruit.

**Décisions requises (résolues par Aldo, 2026-07-12) :**

- [x] [Review][Decision] API finale de `CtaButton` → **RÉSOLU : asChild (D4 à la lettre)** — ajouter le support `asChild` (l'appelant fournit l'élément : `<Link>`, `<button type="submit">`, lien externe), garder la convenance `href` pour le cas funnel courant et le défaut `timePromise="15 min"`. Devient un patch (P7 ci-dessous).
- [x] [Review][Decision] Traitement pill hors home → **RÉSOLU : pill partout (état actuel confirmé)** — Aldo accepte le pill flottant sur toutes les pages ; le compromis « contenu dans les gouttières sur pages denses » est assumé. Aucun changement de code.

**Patchs (correctifs sans ambiguïté) :**

- [x] [Review][Patch] **[HIGH]** Header cassé sur la plage tablette ~640–1000px — `[siana-memento-web/src/components/siana/SiteHeader.tsx:79-133]` — en passant la nav de `absolute` (hors flux) à `mx-auto` (en flux), logo « Siana Memento » et lien « Comment ça marche » se replient sur 2–3 lignes et se chevauchent ; CTA « Créer… » déborde du pill à 640px. Vérifié par capture à 640/700/768/900px. Propre <640px (mobile) et >~1024px (desktop). Fix : `shrink-0 whitespace-nowrap` sur logo + `whitespace-nowrap` sur liens, monter l'apparition nav/CTA (`sm:`→`lg:`), grille `grid-cols-[1fr_auto_1fr]` pour un centrage stable.
- [x] [Review][Patch] **[MED]** Jank au seuil de scroll sur la home — `[siana-memento-web/src/components/siana/SiteHeader.tsx:79-83]` — au franchissement de `scrollY>20` : (a) `mt-2` ajoute +8px de hauteur → tout le contenu saute de 8px (CLS, NFR-P7) ; (b) `mx-auto` déplace la nav quand le CTA apparaît à droite ; (c) `transition-all` prétend animer mais `max-width: none→64rem` n'est pas interpolable (snap) et anime des props de layout (reflow). Fix : hauteur constante (mt-2 permanent), grille (centrage stable), `transition-[background-color,border-color,box-shadow]` au lieu de `transition-all`. Corrigé dans la même passe que le finding HIGH.
- [x] [Review][Patch] **[LOW]** Motif `leaf` : nervure en `var(--background)` — `[siana-memento-web/src/components/siana/landing/DecorativeMotif.tsx]` — suppose un fond = `background` ; posé sur `bg-card`/section teintée/image, le trait affiche la mauvaise couleur (le composant est documenté « à positionner en absolu depuis le parent »). Fix : nervure en négatif (`fillRule="evenodd"`) ou suppression.
- [x] [Review][Patch] **[LOW]** `DecorativeMotif` sans taille par défaut — `[siana-memento-web/src/components/siana/landing/DecorativeMotif.tsx]` — `<svg>` sans width/height ni classe → rendu 300×150 (motif letterboxé) si utilisé sans `className`. Fix : taille par défaut dans le `cn()`.
- [x] [Review][Patch] **[LOW]** `CtaButton` : `size="lg"` entièrement écrasé + `h-11` hors échelle — `[siana-memento-web/src/components/siana/landing/CtaButton.tsx]` — `lg` (`h-10 rounded-md px-6`) est écrasé par `h-11 rounded-full px-6 text-base` ; `h-11` (44px, touch target voulu) n'est pas une variante du DS. Fix : retirer `size="lg"` redondant, garder `h-11`.
- [x] [Review][Patch] **[LOW]** Showcase contredit sa consigne d'opacité — `[siana-memento-web/src/app/design-system/page.tsx]` — motif `sprig` en `text-sage/40` trois lignes au-dessus de « opacité ≤ 15% recommandée ». Fix : aligner valeur et légende.
- [x] [Review][Patch] **[MED]** `CtaButton` : implémenter le contrat `asChild` (D4) — `[siana-memento-web/src/components/siana/landing/CtaButton.tsx]` — issu de la décision ci-dessus. Ajouter la prop `asChild` (l'appelant fournit l'élément via `Slot`), garder `href` en convenance et `timePromise` (défaut "15 min", injecté dans l'enfant en mode asChild quand présent). API figée pour les stories 7.2–7.7.

**Différés (préexistants) :**

- [x] [Review][Defer] **[LOW]** Flash transparent→pill à l'hydratation — `[siana-memento-web/src/components/siana/SiteHeader.tsx:74]` — préexistant : `scrolled` initialisé `false` (SSR ne connaît pas le scroll) ; home rechargée mi-page → header transparent puis pop en pill. Légèrement amplifié par le refactor mais racine antérieure.

**Écartés comme bruit (9) :** `timePromise` whitespace → « · » orphelin (input théorique) ; `Eyebrow asChild` ≠1 enfant (contrat Slot standard, comme Button/Badge) ; `motifs[variant]` sans fallback runtime (garanti par TS) ; code « mort » (scope explicite de la story, D5) ; aucun test unitaire ajouté (décision de la story, pas de runner unitaire, présentational + e2e régression 39/39) ; `Eyebrow` dans `ui/` (conforme D1) ; défaut `variant` dupliqué (identique au pattern button.tsx/badge.tsx) ; `backdrop-blur-sm→md` (aire floutée plus petite, perf immatérielle) ; `rounded-4xl` survendu (cosmétique, tokens préexistants).

## Dev Agent Record

### Agent Model Used

Claude Fable 5 (claude-fable-5)

### Debug Log References

- Aucun blocage. Screenshots de validation visuelle capturés via Playwright (home top/scrolled, /design-system, /generate/upload).

### Completion Notes List

- Task 1 : `Eyebrow` créé en cva (variants `default`/`accent`), asChild via `Slot.Root`, `data-slot="eyebrow"` — pattern identique à `badge.tsx`.
- Task 2 : pattern `<Card className="rounded-3xl">` / `rounded-4xl` documenté dans le showcase (carte icône+eyebrow et grande tuile bento `py-0 overflow-hidden`). Aucun fork de `card.tsx`.
- Task 3 : `SiteHeader` refactoré — header extérieur sticky transparent, contenu dans un div pill (`mt-2 max-w-5xl rounded-full border bg-background/80 backdrop-blur-md shadow-sm`) actif quand `scrolled || !isHome` (même condition que l'ancien état borduré). Tout le comportement préservé (scroll-spy, auth, CTA conditionnel, thème).
  - **Écart volontaire au plan** : la nav ancres centrée en `absolute left-1/2` chevauchait la zone droite dans le pill à 1280px (défaut latent qui existait déjà aux viewports ~1100px avant refonte). Remplacée par un centrage flex `mx-auto` — mêmes liens/comportement, plus aucun chevauchement possible ; la nav n'est plus au centre optique exact mais équilibrée entre logo et zone droite. Validé par screenshot.
- Task 4 : `CtaButton` (server component) — `Button asChild size lg` + `h-11` (touch target ≥44px) `rounded-full`, `Link` interne, suffixe `· {timePromise}` en `font-normal opacity-70`, `timePromise={null}` pour le masquer.
- Task 5 : `DecorativeMotif` — 3 variantes SVG inline (`branch`, `leaf`, `sprig`), `currentColor`, `aria-hidden`, `pointer-events-none select-none` ; nervure de `leaf` creusée en `var(--background)`.
- Task 6 : section "Refonte Landing (Epic 7)" ajoutée au style guide `/design-system`. Validations : `tsc --noEmit` ✅, eslint (aucune nouvelle issue — les 2 issues de `design-system/page.tsx` sont pré-existantes, vérifié par comparaison stash) ✅, `next build` ✅, e2e complet **39/39** ✅ (dont home 6/6), vérification visuelle light des 4 écrans.
- Tests : pas de nouveau test ajouté — story purement visuelle sans logique métier ; la couverture e2e existante (`home.spec.ts` nav/sections) sert de test de régression et passe sans modification, conformément au plan de test de la story.

### File List

- `siana-memento-web/src/components/ui/eyebrow.tsx` — NEW : primitive eyebrow label
- `siana-memento-web/src/components/siana/landing/CtaButton.tsx` — NEW : CTA avec promesse de temps
- `siana-memento-web/src/components/siana/landing/DecorativeMotif.tsx` — NEW : motifs botaniques SVG
- `siana-memento-web/src/components/siana/SiteHeader.tsx` — UPDATE : habillage nav pill + centrage flex de la nav ancres
- `siana-memento-web/src/app/design-system/page.tsx` — UPDATE : section showcase "Refonte Landing (Epic 7)"
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — UPDATE : statuts story/epic
- `_bmad-output/implementation-artifacts/7-1-design-system-de-refonte.md` — story file

## Change Log

- 2026-07-12 : Implémentation complète Story 7.1 — primitives Eyebrow/CtaButton/DecorativeMotif créées, SiteHeader refondu en nav pill, showcase ajouté à /design-system. Zéro nouveau token, zéro nouvelle dépendance. e2e 39/39, build OK.
- 2026-07-12 : Code review adversariale (3 layers) + corrections. 7 patchs appliqués + 1 défaut découvert en vérif visuelle et corrigé. 2 décisions tranchées par Aldo (API CtaButton → asChild ; pill partout). e2e 39/39, build OK, lint/tsc clean. Statut → done.

### Corrections post-review (2026-07-12)

- **[HIGH] Header cassé sur la plage tablette (~640–1000px)** — la nav était passée de `absolute` à `mx-auto` (flux) et faisait déborder/replier logo + liens. Refonte de `SiteHeader` en grille `grid-cols-[1fr_auto_1fr]` avec placement explicite des colonnes (`col-start-1/2/3`), `whitespace-nowrap`/`shrink-0` anti-repli, nav + CTA affichés à partir de `lg` (place suffisante). Centrage de nav stable quel que soit le contenu latéral.
- **[MED] Jank au seuil de scroll home** — largeur (`max-w-5xl`) et hauteur (`mt-2`) désormais constantes dans les deux états ; seuls fond/bordure/ombre transitionnent (`transition-colors` au lieu de `transition-all`, qui animait des propriétés de layout). Plus de saut de 8px ni de snap de largeur.
- **[MED] CtaButton API (D4)** — support `asChild` ajouté (l'appelant fournit `<Link>`/`<button>`/lien externe) ; promesse injectée dans l'enfant via `cloneElement` quand présente ; convenance `href` conservée. Exemple `asChild` ajouté au showcase (prérendu au build = check runtime).
- **[LOW] Motif `leaf`** — nervure `var(--background)` remplacée par deux lobes avec vide central (robuste sur tout fond).
- **[LOW] DecorativeMotif** — taille par défaut `h-40 w-20` (surchargée par className) pour éviter le rendu 300×150 nu.
- **[LOW] CtaButton** — `size="lg"` redondant retiré (le className le surchargeait entièrement).
- **[LOW] Showcase** — opacité du motif alignée sur la consigne « ≤ 15% ».
- **Défaut découvert en vérif visuelle** — sous `lg` la nav en `display:none` sortait de la grille → la zone droite remontait au centre. Corrigé par le placement explicite des colonnes (`col-start-*`). Vérifié par capture à 640/768/900/1024/1280px.
