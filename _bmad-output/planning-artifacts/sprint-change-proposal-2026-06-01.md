# Sprint Change Proposal — 2026-06-01

**Auteur :** Correct-Course (BMad) · **Demandeur :** Aldo · **Epic concerné :** Epic 6 — Dashboard Admin & Opérations Business

## 1. Résumé du problème

Aucune story d'Epic 6 ne prévoit la **navigation entre les pages d'administration**. Or l'epic crée **4 pages `/admin`** distinctes :

| Page | Story | État |
|------|-------|------|
| `/admin/dashboard` | 6.2 | ✅ done |
| `/admin/logs` | 6.4 (ex-6.3) | backlog |
| `/admin/orders` | 6.6 (ex-6.5) | backlog |
| `/admin/testimonials` | 6.7 (ex-6.6) | backlog |

**Découverte :** lors de la revue post-implémentation de la Story 6.2, l'utilisateur a demandé si une sidebar admin était planifiée. Vérification dans tous les artefacts :
- `epics.md`, `prd.md`, `ux-design-specification.md` → **aucune** mention de sidebar / navigation admin.
- `architecture.md` (L1987) → mentionne `Sidebar.tsx` dans une arborescence de fichiers projetée, **sans AC ni story associée**.

**Conséquence si non corrigé :** chaque page admin réimplémenterait son propre garde d'accès (déjà le cas dans `AdminDashboard.tsx` de la 6.2) et sa mise en page, sans moyen de circuler entre sections → duplication + UX incohérente.

**Catégorie :** exigence manquante (gap de planification) découverte en cours d'implémentation. Type : *Misunderstanding/omission of original requirements*.

## 2. Analyse d'impact

- **Epic 6 :** complétable comme prévu, moyennant l'ajout d'**une story** (la coquille de navigation) et la renumérotation des stories suivantes. Pas de remise en cause de l'objectif de l'epic.
- **Stories :**
  - **Nouvelle Story 6.3 « Layout & Navigation Admin ».**
  - Renumérotation : ex-6.3→**6.4** (Logs), ex-6.4→**6.5** (Alertes), ex-6.5→**6.6** (Renvoi+Backups), ex-6.6→**6.7** (Testimonials), ex-6.7→**6.8** (Survey).
  - **Story 6.2 (done)** : sa garde admin (dans `AdminDashboard.tsx`) sera **refactorisée** dans le layout partagé par la 6.3 (dette technique mineure assumée, pas de régression fonctionnelle).
- **PRD :** aucun conflit. La nouvelle story sert FR33 (dashboard admin) + NFR-A2 (navigation clavier) + NFR-S10 (accès admin protégé) — déjà couverts, pas de nouveau FR/NFR.
- **Architecture :** alignement, au contraire — concrétise le `Sidebar.tsx` déjà esquissé (L1987). Pattern Next.js : `src/app/admin/layout.tsx` (route group de fait via le dossier `admin/`) + composant sidebar client.
- **UX :** aucune spec existante ne décrit la nav admin → la 6.3 la définit (sidebar Dashboard/Logs/Commandes/Testimonials, repliable mobile, WCAG AA). Réutilise les patterns transverses (shadcn, Vert Sauge, états neutres).
- **MVP :** **non affecté** — périmètre admin « simple » conservé ; aucune dépendance critique déplacée. Effort estimé **faible** (layout + sidebar + refactor d'un garde existant).

## 3. Approche recommandée

**Option 1 — Direct Adjustment (retenue).** Ajouter une story dédiée dans la structure d'epic existante + renumérotation. Effort : **Low**. Risque : **Low**.
Alternatives écartées : rollback (rien à annuler), revue MVP (scope inchangé).

**Séquencement :** 6.3 jouée **avant** la 6.4 — le layout/sidebar est créé une fois, puis les pages 6.4/6.6/6.7 s'y branchent (au lieu que chacune crée sa nav locale).

## 4. Propositions de changement détaillées

### 4.1 `epics.md`
- **AJOUT** « Story 6.3 : Layout & Navigation Admin » (user story + 5 AC : sidebar persistante avec section active ; layout partagé + garde centralisé ; redirection non-auth→/login & non-admin→/orders ; sidebar mobile repliable + clavier ; liens vers sections non encore implémentées → état « bientôt disponible »).
- **RENUMÉROTATION** des titres : 6.3→6.4, 6.4→6.5, 6.5→6.6, 6.6→6.7, 6.7→6.8. *(Contenu/AC de ces stories inchangés.)*

### 4.2 `sprint-status.yaml`
- **AJOUT** `6-3-layout-et-navigation-admin: backlog` (après 6-2).
- **RENOMMAGE des clés** : `6-3-logs…`→`6-4-logs…`, `…alertes`→`6-5`, `…renvoi…`→`6-6`, `…testimonials…`→`6-7`, `…survey…`→`6-8` (toutes `backlog`). `last_updated: 2026-06-01`.
- *(Aucun fichier de story `.md` à renommer : seules 6.1 et 6.2 existent en fichier, non impactées.)*

### 4.3 Story 6.2 (done) — dette notée
- Refactor à faire **dans la 6.3** : déplacer la garde admin de `AdminDashboard.tsx` vers `src/app/admin/layout.tsx`. Pas de changement de comportement attendu.

## 5. Handoff

**Scope : Moderate** (réorganisation backlog + nouvelle story) → puis implémentation Developer.
1. ✅ `epics.md` + `sprint-status.yaml` mis à jour (fait dans cette passe).
2. **`create-story`** pour matérialiser la 6.3 en fichier de story contexte-complet (prochaine étape recommandée, fenêtre fraîche).
3. **`dev-story`** pour l'implémenter (layout + sidebar + refactor garde 6.2).

**Critères de succès :** sidebar persistante sur toutes les pages `/admin` avec section active ; garde centralisé dans le layout (plus de garde dupliqué par page) ; redirections correctes ; nav mobile + clavier OK ; aucune régression sur `/admin/dashboard`.
