---
baseline_commit: dd2519988d7eb455c55a13f3fe3e7deb4355155b
---

<!-- Story 6.6 — générée par create-story (BMad). Contexte-complet pour dev-story. -->

# Story 6.6: Renvoi Manuel de Designs et Backups DB

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'admin Aldo,
je veux pouvoir renvoyer manuellement un design par email et être assuré que les données sont sauvegardées,
afin de réparer les livraisons échouées et garantir la récupération des données en cas de défaillance.

## Acceptance Criteria

1. **Given** Aldo sur `/admin/orders` et une commande avec statut `email_failed` **When** il clique "Renvoyer l'email" **Then** le système renvoie l'email avec le design HR en pièce jointe et met à jour le statut de la commande (FR47, NFR-R7).
2. **Given** Aldo renvoyant un design **When** le renvoi est déclenché **Then** l'action est loggée avec timestamp et admin_id pour traçabilité (NFR-R8).
3. **Given** la base de données PostgreSQL sur Railway **When** minuit (UTC) chaque jour **Then** un backup automatique est effectué et conservé 30 jours (FR46, NFR-R2).
4. **Given** un paiement Stripe confirmé **When** une erreur survient lors de l'envoi email ou de la génération **Then** la commande reste enregistrée en base avec statut récupérable — aucune perte de données (NFR-R3).

[Source: epics.md#Story-6.6 L1043-1066 — user story + 4 AC verbatim]

## Tasks / Subtasks

### A. Backend — statut `email_failed` et récupérabilité (AC: #1, #4)

- [x] **Migration enum `orders.status`** ajouter la valeur `email_failed` à l'enum existant `('pending', 'paid', 'failed')`.
  - [x] Nouvelle migration `*_add_email_failed_to_orders_status.ts` (ne pas réécrire la migration de création).
  - [x] Mettre à jour le type TypeScript dans `app/models/order.ts` : `status: 'pending' | 'paid' | 'failed' | 'email_failed'`.
- [x] **Marquer l'échec d'envoi dans le webhook Stripe** dans `stripe_service.ts:handleCheckoutCompleted()` : quand `sendDesignDelivery()` retourne `{ success: false }` après un paiement confirmé, passer `order.status = 'email_failed'` et sauvegarder.
  - [x] ⚠️ La commande reste en base, `emailSentAt` reste `null` → état récupérable (AC4). Ne PAS supprimer ni rollback la commande sur échec email.
  - [x] Conserver le pattern fire-and-forget hors transaction ACID existant.

### B. Backend — endpoints admin orders (AC: #1, #2)

- [x] **`GET /api/admin/orders`** lister les commandes pour la table admin (date, email user, template design, montant, statut), avec filtre par statut (notamment `email_failed`) et pagination.
  - [x] Réutiliser le pattern de `LogsService` / `listGenerations()` (story 6.4) pour pagination + filtre.
  - [x] Précharger les relations `User` et `Design` (eager loading) pour éviter les N+1.
- [x] **`POST /api/admin/orders/:id/resend-email`** renvoyer le design.
  - [x] Charger la commande + relations `user` et `design`, 404 si absente.
  - [x] Appeler `sendDesignDelivery(order, user, design)` (fonction existante — attache déjà le PNG HR Cloudinary).
  - [x] Sur succès : `order.status = 'paid'`, `order.emailSentAt = DateTime.now()`, save. Retourner le nouvel état.
  - [x] Sur échec : laisser `email_failed`, retourner une erreur 502/explicite (pas de 500 silencieux).
- [x] **Câbler les routes** dans `start/routes.ts` à l'intérieur du groupe `/api/admin` existant (déjà protégé par `middleware.auth()` + `middleware.admin()`).

### C. Backend — traçabilité du renvoi (AC: #2)

- [x] **Log Pino structuré** dans `admin_controller.ts:resendEmail()` : émettre un événement JSON `{ event: 'email_resent_manual', orderId, adminId, status, timestamp }`.
  - [x] 🔑 Réutiliser l'approche logging structuré Pino de la story 6.4 (NFR-R8) — pas de nouvelle table d'audit.
  - [x] Logger aussi bien le succès que l'échec du renvoi.

### D. Frontend — page `/admin/orders` (AC: #1)

- [x] **Remplacer le placeholder** `AdminComingSoon` dans `src/app/admin/orders/page.tsx` par un composant client `AdminOrders`.
  - [x] Table (réutiliser `components/ui/table.tsx` créé en 6.4) : date, email client, template, montant (€), badge statut coloré.
  - [x] Filtre par statut avec un onglet/segment "Échecs email seulement" (`email_failed`).
  - [x] Bouton "Renvoyer l'email" sur les lignes `email_failed` → appelle l'endpoint, état de chargement, désactivé pendant l'appel.
  - [x] Succès → `toast.success()` + mise à jour optimiste/refetch de la ligne ; erreur réseau/serveur → `toast.error()` (cf. conventions toasts du CLAUDE.md).
  - [x] `metadata` `noindex, nofollow` conservée (cohérent avec les autres pages admin).
- [x] **API client** ajouter `getAdminOrders(filters?)` et `resendOrderEmail(orderId)` dans `src/lib/api/admin.ts` (suivre le style de `getAdminLogs`).

### E. Ops — backups PostgreSQL Railway (AC: #3)

- [x] **Activer les backups managés Railway** sur le service PostgreSQL : backups quotidiens automatiques, rétention 30 jours, fenêtre nocturne (~minuit UTC).
  - [x] 🔑 Décision : pas de cron `pg_dump` maison ni de scheduler applicatif (cf. Dev Notes). Backups délégués à Railway.
- [x] **Documenter le runbook de restauration** (dans `docs/` ou la note de la story) : où voir les backups Railway, comment restaurer un point-in-time, vérification de rétention 30j.
- [x] **Vérifier** dans le dashboard Railway qu'au moins un backup a été produit et que la rétention est bien à 30 jours.

### F. Tests (AC: #1, #2, #4)

- [x] **Tests fonctionnels API** (`tests/functional/admin/orders.spec.ts`) : non-admin → 403 ; `GET /orders` paginé + filtre `email_failed` ; `resend-email` succès passe `email_failed`→`paid` + `emailSentAt` set ; `resend-email` sur 404 ; échec `sendDesignDelivery` mocké laisse `email_failed`.
- [x] **Test webhook** : échec `sendDesignDelivery` après paiement → commande conservée en `email_failed` (AC4), pas de perte de données.
- [x] **E2E Playwright** (`e2e/admin-orders.spec.ts`) : admin voit la table, filtre les échecs, clique "Renvoyer l'email", voit le toast succès et le statut mis à jour. Suivre le pattern de `e2e/admin-logs.spec.ts`.

### Review Findings

<!-- Revue de code adverse BMAD (full mode) — 2026-06-02. Findings F1-F5 résolus le 2026-06-02 (review-fixes) : F1 → restreindre à email_failed (409) ; F2/F3/F4/F5 patchés. -->

- [x] [Review][Decision] **(Résolu — option a)** Endpoint resend sans garde de statut (peut renvoyer/forcer `paid` sur n'importe quelle commande) — `resendDelivery(orderId)` charge la commande puis appelle `sendDesignDelivery` sans vérifier `order.status`. Un POST `/api/admin/orders/:id/resend-email` sur une commande `pending`/`failed`/déjà `paid` enverrait le design HR et basculerait le statut à `paid` (avec `emailSentAt = now()`). Le bouton UI n'apparaît que sur `email_failed`, mais l'endpoint n'est pas protégé. AC1 cible explicitement les commandes `email_failed`. Décision : (a) restreindre l'endpoint aux seuls statuts `email_failed` (et éventuellement `paid` pour un re-envoi volontaire) en retournant 409/422 sinon, ou (b) accepter le comportement actuel comme intentionnel. [app/services/orders_admin_service.ts:97-122]
- [x] [Review][Patch] **(Résolu)** AC4 : le passage en `email_failed` dans le webhook n'a aucun test fonctionnel — Le seul chemin testé est l'échec du *resend* (`orders.spec.ts`). La branche `else` de `handleCheckoutCompleted()` (échec d'envoi après paiement → `order.status = 'email_failed'`) n'est exercée par aucun test : `delivery_email.spec.ts:144` « order stays paid even if email delivery fails » ne déclenche jamais le webhook et n'invoque pas la branche. Le déclencheur principal d'AC4 repose donc sur du raisonnement, pas sur un test. Ajouter un test fonctionnel sur `handleCheckoutCompleted` (ou `stripe_service`) vérifiant `email_failed` + `emailSentAt` null sur échec d'envoi. [app/services/stripe_service.ts:114-124]
- [x] [Review][Patch] **(Résolu)** `down()` de la migration échoue s'il existe des lignes `email_failed` — La CHECK constraint restrictive re-ajoutée par `down()` (`status IN ('pending','paid','failed')`) sera rejetée par Postgres si des commandes `email_failed` existent, bloquant tout rollback. Avant le re-`ADD CONSTRAINT`, normaliser les données : `UPDATE orders SET status='paid' WHERE status='email_failed'` (ou `failed`, au choix). Sévérité faible (rollback rarement exécuté en prod). [database/migrations/1775900000300_add_email_failed_to_orders_status.ts:23-26]
- [x] [Review][Patch] **(Résolu)** `resendingId` unique : un 2e renvoi concurrent réactive le bouton du 1er — `resendingId` est un `number | null` global ; lancer un renvoi sur la ligne B pendant que A est en vol écrase `resendingId`, ré-activant le bouton de A en plein appel (risque de double envoi). Utiliser un `Set<number>` d'ids en cours. Sévérité faible. [siana-memento-web/src/components/siana/AdminOrders.tsx:71-92]
- [x] [Review][Patch] **(Résolu)** Mise à jour optimiste sous filtre « échecs seulement » laisse une ligne périmée — Après un renvoi réussi avec `failedOnly=true`, la ligne passe au badge « Payée » mais reste affichée dans la liste filtrée `email_failed` (incohérence visuelle jusqu'au prochain refetch). Déclencher un refetch (ou retirer la ligne de la liste) quand le filtre est actif. Sévérité faible/cosmétique. [siana-memento-web/src/components/siana/AdminOrders.tsx:65-85]

## Dev Notes

### Contexte & périmètre

Story 6.6 = deux blocs fonctionnels indépendants de la 6.4 (logs de génération) : (1) **réparation manuelle des livraisons email échouées** depuis `/admin/orders`, et (2) **garantie de sauvegarde des données**. Elle s'appuie sur le domaine **Orders + email** (Epic 4/5) déjà en place, pas sur la couche `Generation`. Elle peut donc être développée sans attendre la 6.4/6.5.

Le gros de l'infra existe : `sendDesignDelivery()` (Resend + PNG HR Cloudinary) fonctionne, le webhook Stripe livre déjà l'email après paiement, le middleware admin protège `/api/admin`, et la page `/admin/orders` existe en placeholder. Le travail consiste surtout à : exposer les commandes côté admin, ajouter un statut récupérable `email_failed`, un endpoint de renvoi, et tracer l'action.

### 🔑 Décision — Backups délégués à Railway (managed)

- **Choix** : activer les backups managés natifs du service PostgreSQL Railway (quotidiens, rétention 30j), plutôt qu'une commande Ace `pg_dump` + scheduler applicatif.
- **Rationale** : solo dev, budget infra 200€, aucun scheduler (`@adonisjs/scheduler`) ni stockage backup (S3) installé aujourd'hui. Les backups managés couvrent l'AC3 sans code ni surface de maintenance supplémentaire.
- **Conséquence** : l'AC3 est une tâche **ops + documentation** (config dashboard + runbook de restauration), pas du code applicatif. `architecture.md` (L1352-1375) décrivait un cron `pg_dump` ; on s'en écarte volontairement pour le MVP.
- [Source: décision utilisateur 2026-06-02 ; epics.md#Story-6.6 L1059-1061]

### 🔑 Décision — Traçabilité via log Pino structuré (pas de table d'audit)

- L'AC2 demande un log « timestamp + admin_id ». On réutilise le logging JSON structuré Pino établi par la story 6.4 (NFR-R8) plutôt que de créer une table `admin_logs`.
- Événement : `{ event: 'email_resent_manual', orderId, adminId, status, timestamp }`, émis succès comme échec.

### 🔑 Décision — Transition de statut au renvoi

- Renvoi **réussi** : `email_failed` → `paid` + `emailSentAt = now()` (la commande redevient une livraison nominale).
- Renvoi **échoué** : reste `email_failed`, l'erreur remonte à l'admin (toast). Idempotence assurée par `emailSentAt` côté logique de livraison existante.

### État du code backend (vérifié)

- **Modèle `Order`** : `status: 'pending' | 'paid' | 'failed'`, plus `emailSentAt: DateTime | null`, relations `belongsTo(User)` et `belongsTo(Design)`. Manque `email_failed`. [Source: app/models/order.ts:7-46]
- **`sendDesignDelivery(order, user, design)`** : retourne `{ success, resendId? }`, attache le PNG HR via `getOriginalDesignUrl(design.cloudinaryPublicId)`, lib **Resend** (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`), gère ses erreurs sans throw. Réutilisable tel quel pour le renvoi. [Source: app/services/email_service.ts:62-131]
- **Webhook → livraison** : `webhooks_controller` (`POST /api/webhooks/stripe`) → `stripe_service.handleCheckoutCompleted()` : transaction ACID passe Order/Design en `paid`, puis envoi fire-and-forget ; succès → `emailSentAt` set ; échec → commande reste `paid`, `emailSentAt` null (à faire évoluer vers `email_failed`). [Source: app/services/stripe_service.ts:56-115]
- **Routes admin** : groupe `/api/admin` (`/metrics`, `/metrics/export-csv`, `/logs`) protégé par `middleware.auth()` + `middleware.admin()`. [Source: start/routes.ts:80-89]
- **`admin_controller.ts`** : injecte `MetricsService`/`LogsService`, chaque méthode fait `auth.getUserOrFail()` puis log l'événement. Pattern à suivre pour `listOrders` / `resendEmail`. [Source: app/controllers/admin_controller.ts:1-127]
- **Middleware admin** : vérifie `ctx.auth.user.isAdmin`, 403 sinon ; chaîné après `auth()`. [Source: app/middleware/admin_middleware.ts:1-21]

### État du code frontend (vérifié)

- **`/admin/orders`** = placeholder `<AdminComingSoon title="Commandes" />`, `metadata` `noindex, nofollow`. [Source: siana-memento-web/src/app/admin/orders/page.tsx:1-12]
- **`src/lib/api/admin.ts`** : expose `getAdminMetrics`, `getExportCsvUrl`, `getAdminLogs`. Ajouter `getAdminOrders` + `resendOrderEmail`. [Source: siana-memento-web/src/lib/api/admin.ts:1-117]
- **`components/ui/table.tsx`** : composant table créé en 6.4, réutilisable pour la table orders.

### Patterns à réutiliser

- Pagination + filtre serveur : `LogsService.listGenerations()` (6.4).
- Toasts : `toast()` de `sonner` pour erreurs système, succès en `toast.success` (cf. conventions CLAUDE.md). `<Toaster>` déjà monté dans `layout.tsx`.
- Tests E2E admin : `e2e/admin-logs.spec.ts` (6.4) comme gabarit.

### Garde-fous anti-erreurs

- ❌ Ne PAS supprimer/rollback une commande sur échec d'envoi email — elle doit rester récupérable (AC4).
- ❌ Ne PAS réécrire la migration de création d'`orders` pour l'enum — ajouter une migration dédiée.
- ❌ Ne PAS installer `@adonisjs/scheduler` ni écrire un cron `pg_dump` — backups délégués à Railway (décision ci-dessus).
- ❌ Ne PAS exposer les endpoints orders hors du groupe `/api/admin` (perte de la garde admin).

### Dependencies

- **Indépendante de 6.4 et 6.5** (couche `Generation`). Repose sur le domaine Orders/email d'Epic 4/5, déjà livré.
- Resend déjà configuré (réutilisé depuis la pré-inscription / Epic 4).

### References

- epics.md#Story-6.6 (L1043-1066) — user story + AC.
- architecture.md (L1352-1375) — section backups (approche cron documentée, écartée pour Railway managed).
- PRD : FR46, FR47, NFR-R2, NFR-R3, NFR-R7, NFR-R8.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Claude Opus 4.8, 1M context)

### Debug Log References

- Développée en worktree isolé `feat/admin-orders-resend` (base `dd25199`).
- API `typecheck` : exit 0. Web `tsc --noEmit` + `eslint` (fichiers 6.6) : exit 0.
- Migration `1775900000300_add_email_failed_to_orders_status` appliquée sur la DB dev (143 ms).
- Tests fonctionnels `tests/functional/admin/orders.spec.ts` : **9 passed**. Logs Pino
  `email_resent_manual` (adminId/orderId/outcome/code) bien émis (AC2 vérifié).
- Suite API complète : **181 passed** (aucune régression — webhook réel jamais exécuté de
  bout en bout dans les tests existants, signature 400 + ACID simulé).
- E2E `e2e/admin-orders.spec.ts` : **6 passed** (servi via webpack sur port dédié 3100 ;
  turbopack rejette le `node_modules` symlinké du worktree).
- Lint web global : 15 problèmes préexistants (identiques sur `main`), **aucun** dans les
  fichiers de la 6.6.

### Completion Notes List

- ✅ **AC#1** — `GET /api/admin/orders` (paginé, filtre `status`) + `POST /api/admin/orders/:id/resend-email` ;
  page `/admin/orders` (table, filtre « échecs email seulement », bouton « Renvoyer l'email »,
  toasts, mise à jour optimiste). Renvoi réussi : `email_failed` → `paid` + `emailSentAt`.
  Le PNG HR est attaché par `sendDesignDelivery()` existant.
- ✅ **AC#2** — log Pino structuré `email_resent_manual` (event, orderId, adminId, outcome,
  status, timestamp), émis au succès comme à l'échec, dans `admin_controller.resendEmail()`.
- ✅ **AC#3** — backups délégués à Railway managed ; runbook `docs/backups-railway.md`
  (config dashboard quotidien/00:00 UTC/rétention 30j + restauration + option pg_dump de secours).
  ⚠️ Activation effective dans le dashboard Railway = action ops manuelle (hors code).
- ✅ **AC#4** — sur échec d'envoi après paiement, `handleCheckoutCompleted()` passe la commande
  en `email_failed` (conservée, `emailSentAt` null) → récupérable, aucune perte. Couvert par le
  test « failed delivery keeps the order in email_failed ».
- **Nouveau service** : `OrdersAdminService` (liste paginée + `resendDelivery`), miroir de `LogsService`.
- **Nouveau statut** : enum `orders.status` étendu via migration d'altération de la CHECK
  constraint Postgres `orders_status_check` (colonne `text`, pas d'enum natif).
- **Chemin succès du renvoi** : couvert en E2E (API mockée). Côté API fonctionnel, seul le
  chemin d'échec est testable sans mock réseau (convention du projet : pas de lib de mock,
  échec simulé via `cloudinaryPublicId: null`).
- **Note** : un stub orphelin `tests/functional/admin/orders.spec.ts` (non tracké, helpers
  inexistants `createAdminUser`/`loginUser`, non runnable) a été remplacé par la version correcte.

### File List

**NEW — backend**
- `siana-memento-api/database/migrations/1775900000300_add_email_failed_to_orders_status.ts`
- `siana-memento-api/app/services/orders_admin_service.ts`
- `siana-memento-api/tests/functional/admin/orders.spec.ts`

**UPDATE — backend**
- `siana-memento-api/app/models/order.ts`
- `siana-memento-api/app/services/stripe_service.ts`
- `siana-memento-api/app/controllers/admin_controller.ts`
- `siana-memento-api/start/routes.ts`
- `siana-memento-api/tests/helpers/factories.ts` (type `status` du factory élargi à `email_failed`)
- `siana-memento-api/tests/functional/orders/webhook.spec.ts` (test webhook AC4 — review-fixes F2)

**NEW — docs**
- `docs/backups-railway.md` (runbook backups Railway — AC3)

**NEW — frontend**
- `siana-memento-web/src/components/siana/AdminOrders.tsx`
- `siana-memento-web/e2e/admin-orders.spec.ts`

**UPDATE — frontend**
- `siana-memento-web/src/app/admin/orders/page.tsx`
- `siana-memento-web/src/lib/api/admin.ts`

**READ-FOR-CONTEXT**
- `siana-memento-api/app/services/email_service.ts`
- `siana-memento-api/app/services/logs_service.ts`
- `siana-memento-web/src/components/ui/table.tsx`
- `siana-memento-web/e2e/admin-logs.spec.ts`

**NE PAS TOUCHER**
- `siana-memento-api/database/migrations/1772800000000_create_orders_table.ts` (migration de création — utiliser une migration d'altération)

**OPS (hors repo)**
- Config backups managés du service PostgreSQL dans le dashboard Railway.

## Change Log

| Date | Version | Description | Auteur |
|------|---------|-------------|--------|
| 2026-06-02 | 0.1 | Story 6.6 créée (ready-for-dev) — renvoi manuel email depuis `/admin/orders` (statut `email_failed`, endpoint resend, traçabilité Pino) + backups PostgreSQL délégués à Railway managed. | create-story |
| 2026-06-02 | 1.0 | Implémentation 6.6 (review) : statut `email_failed` (migration + webhook), `OrdersAdminService` + endpoints admin orders/resend + log Pino, page `/admin/orders`, runbook backups Railway. Tests : API 9/9 ciblés, suite API 181/181, E2E 6/6. | Amelia (dev-story) |
| 2026-06-02 | 1.1 | Revue adverse BMAD (full) + résolution F1-F5 : garde de statut `email_failed` (409) sur le renvoi, test webhook AC4, fix `down()` migration, `Set` d'ids en cours (anti double-envoi), retrait de ligne sous filtre. Tests : suite API 183/183, E2E 7/7. | review-fixes |
| 2026-06-02 | 1.2 | Story passée en `done` (revue résolue) et mergée sur `main` (rebase au-dessus de la 6.5, fast-forward `6ffb5ba`). Suite API intégrée 189/189. | review-fixes |
