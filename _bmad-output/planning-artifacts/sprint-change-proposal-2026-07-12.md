# Sprint Change Proposal — Epic 7 : Refonte Landing "Récit Visuel"

**Date :** 2026-07-12
**Auteur :** Aldo (via workflow Correct Course)
**Classification :** Moderate — Direct Adjustment (additif, sans rollback)

---

## 1. Issue Summary

**Problème déclencheur.** Un benchmark du site [thelma.pet](https://thelma.pet/) — produit quasi identique (portrait animalier généré par IA, livré imprimé) — révèle un **écart d'exécution narrative** avec la landing actuelle de Siana Memento (livrée en Epic 5).

La landing Epic 5 est fonctionnelle et couvre les FRs (hero, galerie, témoignages, footer) mais reste **statique et informative** là où Thelma raconte le produit : une scène animée épinglée au scroll, un hero "avant/après" en une image, une galerie qui démontre la cohérence IA. L'écart n'est **pas la charte** (celle de Siana est déjà distincte et de qualité) mais **les layouts et l'exécution des animations**.

**Décision produit (Aldo, 2026-07-12) :**
- Ampleur : **refonte complète = nouvelle Epic 7**.
- Charte : **garder l'identité Siana** (Sage Green `#2D4A3E`, Clash Display, Satoshi). Emprunter uniquement les **patterns de layout et les animations** de Thelma.

---

## 2. Impact Analysis

- **Epic Impact.** Nouvelle **Epic 7** qui refond les sections livrées par l'**Epic 5** (Stories 5.1 → 5.4). Ces stories restent "done" mais sont annotées "raffinées par Epic 7". Aucune autre epic touchée.
- **Story Impact.** 7 nouvelles stories (7.1 → 7.7). Réutilisent les composants et le contenu existants (testimonials Epic 6, FAQ, exemples de designs).
- **FR Impact.** **Aucun nouveau FR.** Toujours FR27 (pricing), FR32 (RGPD), FR49/FR50 (contact/testimonials). Changement de présentation uniquement.
- **NFR Impact.** À **préserver impérativement** : NFR-P2 (LCP <2.5s), NFR-P7 (Lighthouse Perf ≥90 mobile, SEO ≥95). Renforcement accessibilité : `prefers-reduced-motion` obligatoire (NFR-A). L'animation GSAP est le **risque perf n°1**.
- **Artifact Conflicts.**
  - *PRD* : aucun changement de scope. Pas d'édition requise.
  - *Architecture* : ajout dépendance frontend **GSAP + ScrollTrigger** → 1 note à ajouter (bundle, lazy-load, `will-change` maîtrisé).
  - *UX spec* : ajout d'une section "Patterns landing narratifs".
- **Technical Impact.** Frontend Next.js uniquement. Aucune migration DB, aucun endpoint, aucun impact backend AdonisJS.

---

## 3. Recommended Approach

**Direct Adjustment.** Ajouter l'Epic 7 au backlog sans toucher au code livré tant que les stories ne sont pas jouées. Pas de rollback (l'Epic 5 reste en prod jusqu'au remplacement section par section).

- **Effort estimé :** 7 stories, dont 7.3 (scène pinnée GSAP) la plus lourde/risquée.
- **Risque :** perf mobile (animations) → mitigé par lazy-load ScrollTrigger + budget Lighthouse en critère d'acceptation de chaque story visuelle.
- **Timeline :** post-MVP, après la séquence pré-launch en cours (qualité IA → sessionToken → audit sécu). N'est **pas** bloquant pour le go-live.

---

## 4. Detailed Change Proposals

### 4.1 — epics.md : ajouter le bloc Epic 7 (voir Annexe A ci-dessous, prêt à coller)

### 4.2 — architecture.md : ajouter une note dépendance

> **Section Frontend / Dépendances** — Ajout : `gsap` + plugin `ScrollTrigger` pour les animations scroll-driven de la landing (Epic 7). Chargement différé (dynamic import / registration côté client uniquement), respect `prefers-reduced-motion`, budget perf : ne pas dégrader LCP <2.5s ni Lighthouse ≥90 mobile.

### 4.3 — ux-design-specification.md : ajouter section "Patterns landing narratifs"

> Documenter : hero avant/après (photo brute + design fini dans une scène), scène pinnée 4 étapes (upload → génération → templates → livré) avec progress-bar, galerie "même couple × 5 templates" façon œuvres encadrées, bento qualité à eyebrow labels, FAQ 2 colonnes (titre sticky + accordéon). **Tous rendus avec la charte Siana existante.**

---

## 5. Implementation Handoff

**Scope : Moderate.** Route : Story cycle BMad standard.

1. `bmad-create-story` sur **Story 7.1** (design system de refonte — base des autres).
2. `bmad-dev-story` → `bmad-code-review` par story.
3. Ordre conseillé : 7.1 (socle) → 7.2 / 7.4 (fort ROI, faible risque) → 7.5 / 7.6 / 7.7 → 7.3 (scène pinnée GSAP, en dernier car la plus risquée).

**Critères de succès :** chaque story visuelle valide Lighthouse ≥90 mobile + LCP <2.5s ; 7.3 valide un fallback `prefers-reduced-motion` propre.

---

## Annexe A — Bloc Epic 7 (à insérer dans epics.md)

### Epic 7 : Refonte Landing "Récit Visuel"

Les visiteurs découvrent Siana Memento à travers une landing narrative : hero avant/après, scène de génération animée au scroll, galerie des 5 templates mis en scène, et sections qualité/FAQ/avis élevées. Refonte visuelle des sections de l'Epic 5, dans la charte Siana existante (Sage Green, Clash Display, Satoshi), inspirée des patterns de thelma.pet.

FRs couverts : FR27, FR32, FR49, FR50 (aucun nouveau — refonte de présentation)
NFRs clés : NFR-P2 (LCP <2.5s), NFR-P7 (Lighthouse ≥90 mobile), NFR-A (accessibilité + `prefers-reduced-motion`)
Raffine : Epic 5 (Stories 5.1–5.4, restent "done")

- **Story 7.1 — Design System de refonte** : primitives partagées (eyebrow labels petites-caps/letter-spacing, cartes coins arrondis, nav pill sticky floutée, CTA avec promesse de temps "· 15 min", motifs déco discrets). Socle des stories suivantes.
- **Story 7.2 — Hero avant/après** : photo couple + Save the Date fini dans une scène unique, carousel, CTA temps. Remplace 5.1. AC : Lighthouse ≥90 mobile, LCP <2.5s, SEO/OG préservés.
- **Story 7.3 — Scène pinnée "Comment ça marche"** : GSAP ScrollTrigger, une carte se métamorphose sur 4 étapes (upload → génération IA → 5 templates → livré) + progress-bar verticale. Remplace la partie "Comment ça marche" de 5.2. AC : fallback `prefers-reduced-motion`, pas de dégradation LCP.
- **Story 7.4 — Galerie "même couple × 5 templates"** : le même couple décliné dans Bohème/Moderne/Classique/Vintage/Minimaliste, présentés comme œuvres encadrées + CTA. Remplace la galerie de 5.2.
- **Story 7.5 — Bento Qualité / Livraison** : grande image + cartes à icône (fichier HD 3000×4000, délai 15 min, formats, RGPD 7 jours) avec eyebrow labels.
- **Story 7.6 — FAQ 2 colonnes** : titre géant sticky à gauche + accordéon à droite (contenu FAQ existant).
- **Story 7.7 — Section Avis clients** : réutilise les testimonials admin (Epic 6). Raffine 5.3.
