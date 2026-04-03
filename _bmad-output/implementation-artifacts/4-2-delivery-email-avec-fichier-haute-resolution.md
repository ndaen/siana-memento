# Story 4.2 : Delivery Email avec Fichier Haute Résolution

Status: done

## Story

En tant qu'utilisateur ayant payé,
je veux recevoir automatiquement mon design par email,
afin de disposer immédiatement du fichier haute résolution sans action supplémentaire.

## Acceptance Criteria

1. **Given** une commande confirmée par le webhook Stripe (`checkout.session.completed`)
   **When** le système traite la confirmation
   **Then** un email est envoyé via Resend dans les 60 secondes avec le fichier HR attaché (minimum 3000x3000px) et un message chaleureux (FR28, FR29, NFR-I3)

2. **Given** l'email envoyé
   **When** l'utilisateur l'ouvre
   **Then** il peut télécharger directement le fichier haute résolution depuis la pièce jointe (FR30)

3. **Given** l'adresse email contenant des espaces ou mal formatée
   **When** le système tente l'envoi
   **Then** l'email est nettoyé (trim) et validé avant l'envoi (FR42)

4. **Given** l'envoi email qui échoue
   **When** une erreur de delivery est détectée
   **Then** l'échec est loggé avec le contexte complet (NFR-I4) et le champ `emailSentAt` reste `null` sur l'order (permettant un renvoi futur, story 6-5)

5. **Given** un webhook reçu en double (retry Stripe)
   **When** l'email a déjà été envoyé (`order.emailSentAt` non null)
   **Then** l'email n'est PAS renvoyé (idempotence — pas de double-envoi)

## Tasks / Subtasks

### Backend — EmailService (Resend)

- [x] Task 1 : Installer `resend` dans `siana-memento-api/` (AC: #1)
  - [x] `npm install resend`
  - [x] Ajouter `RESEND_API_KEY` et `RESEND_FROM_EMAIL` dans `start/env.ts` via `Env.create()` validators
  - [x] Ajouter les valeurs dans `.env.example` (déjà présentes)

- [x] Task 2 : Créer `app/services/email_service.ts` (AC: #1, #2, #3, #4)
  - [x] `sendDesignDelivery(order: Order, user: User, design: Design): Promise<{ success: boolean; resendId?: string }>`
    1. Construire l'URL Cloudinary originale (sans watermark) : `cloudinary.url(design.cloudinaryPublicId, { secure: true })` — c'est l'image HR
    2. Télécharger l'image en buffer via `fetch(originalUrl)` → `Buffer.from(await res.arrayBuffer())`
    3. Email trim : `user.email.trim()` avant envoi (AC#3, bug connu)
    4. Envoyer via Resend : `resend.emails.send({ from, to, subject, html, attachments: [{ filename, content: buffer }] })`
    5. Logger `{ event: 'delivery_email_sent', orderId, resendId }`
    6. En cas d'erreur : logger `{ event: 'delivery_email_failed', orderId, error }`, ne PAS throw (le webhook doit retourner 200)
  - [x] Template HTML inline (pas de fichier template séparé — MVP) :
    - Subject : `Votre Save the Date est prêt ! — Siana Memento`
    - Body : message chaleureux avec prénoms des partenaires, date du mariage, lien support
    - Utiliser `design.partner1Name`, `design.partner2Name`, `design.weddingDate` pour personnaliser
    - Footer : mention RGPD ("Ce fichier reste disponible 7 jours dans votre espace personnel")

### Backend — Migration & Modèle

- [x] Task 3 : Créer migration `add_email_sent_at_to_orders` (AC: #5)
  - [x] Ajouter colonne `email_sent_at` (timestamp, nullable) à la table `orders`
  - [x] Pas de valeur par défaut — null = email pas encore envoyé

- [x] Task 4 : Mettre à jour le modèle `Order` (AC: #5)
  - [x] Ajouter `@column.dateTime() declare emailSentAt: DateTime | null`

### Backend — Intégration dans le flow webhook

- [x] Task 5 : Modifier `handleCheckoutCompleted` dans `stripe_service.ts` (AC: #1, #5)
  - [x] Après la transaction ACID (order paid + design paid), déclencher l'envoi email
  - [x] Charger le user : `await User.findOrFail(order.userId)`
  - [x] Charger le design : rechargé hors transaction via `Design.findOrFail`
  - [x] Vérifier idempotence email : `if (order.emailSentAt) return` — skip si déjà envoyé
  - [x] Appeler `emailService.sendDesignDelivery(order, user, design)`
  - [x] Si succès : `order.emailSentAt = DateTime.now()` + `await order.save()`
  - [x] L'envoi email est HORS de la transaction ACID Stripe (fire-and-forget avec logging) — un échec email ne doit PAS faire échouer le webhook

### Backend — Tests

- [x] Task 6 : Tests fonctionnels (`tests/functional/orders/delivery_email.spec.ts`) (AC: #1-#5)
  - [x] Test : `sendDesignDelivery` returns false when cloudinaryPublicId is null
  - [x] Test : `sendDesignDelivery` returns false when Cloudinary fetch fails (404)
  - [x] Test : email trim — leading/trailing spaces trimmed (AC#3)
  - [x] Test : emailSentAt is null by default (AC#4 — email not sent yet)
  - [x] Test : emailSentAt can be set on order
  - [x] Test : idempotence — si `emailSentAt` déjà set, pas de deuxième envoi (AC#5)
  - [x] Test : order stays paid even if email delivery fails (ACID independence)
  - [x] `npx tsc --noEmit` — zéro erreur TypeScript
  - [x] Full test suite : 115/115 tests passent, zéro régression

### Vérification

- [x] Task 7 : Test manuel avec Stripe CLI + Resend (effectué par Aldo)
  - [x] Flow complet : payer via Stripe test → webhook → email reçu dans la boîte mail avec le fichier HR en PJ
  - [x] Vérifier que la PJ est bien l'image HD (pas la preview watermarquée)
  - [x] Vérifier le contenu de l'email (prénoms, date, message chaleureux)

## Dev Notes

### Architecture : Resend côté backend AdonisJS

Resend est déjà utilisé côté frontend (Next.js) pour la waitlist (`siana-memento-web/src/app/actions.ts`), mais côté **backend AdonisJS** c'est la première utilisation. Le package `resend` est un simple SDK REST — pas de dépendance lourde.

```typescript
import { Resend } from 'resend'
import env from '#start/env'

const resend = new Resend(env.get('RESEND_API_KEY'))
```

### Fichier HR : Cloudinary original sans watermark

Le flow Cloudinary (story 3-6) stocke deux assets par design :
- **Original** : `designs/design-{designId}` → image HR sans watermark (jamais exposée au frontend)
- **Preview** : `previews/design-{designId}` → version watermarquée (affichée dans l'UI)

Pour l'email, on utilise l'**original** via `design.cloudinaryPublicId` :
```typescript
import { v2 as cloudinary } from 'cloudinary'

const originalUrl = cloudinary.url(design.cloudinaryPublicId, { secure: true })
// → https://res.cloudinary.com/.../designs/design-42.png
```

Puis on télécharge le buffer pour l'attacher à l'email Resend (Resend accepte `content: Buffer` dans les attachments).

### Point d'ancrage : `handleCheckoutCompleted`

L'email est déclenché APRÈS la transaction ACID dans `stripe_service.ts:54-90`. Le flow devient :

```
Webhook Stripe → constructWebhookEvent → idempotence check
  → handleCheckoutCompleted:
    1. Transaction ACID : Order.status='paid' + Design.status='paid'
    2. Vérifier order.emailSentAt (idempotence email)
    3. Charger User + construire URL Cloudinary
    4. sendDesignDelivery(order, user, design)
    5. Si succès : order.emailSentAt = now + save
    6. Logger résultat
  → markEventProcessed
```

L'email est **hors transaction** : un échec d'envoi ne doit pas annuler le paiement. Le webhook retourne toujours 200.

### Template email — MVP inline

Pas de système de templates complexe. Un HTML inline dans `email_service.ts` :

```
Subject: Votre Save the Date est prêt ! — Siana Memento

Body:
- Salutation chaleureuse avec prénoms : "Félicitations {partner1} & {partner2} !"
- Confirmation : "Votre Save the Date pour le {weddingDate} est prêt."
- PJ : "Vous trouverez votre design en haute résolution en pièce jointe."
- Support : "Une question ? Répondez simplement à cet email."
- RGPD footer : "Vos photos seront supprimées sous 7 jours. Vous pouvez re-télécharger votre design depuis votre espace personnel pendant cette période."
```

### Conventions existantes à respecter

**Backend (AdonisJS 6) :**
- Fichiers snake_case : `email_service.ts`
- Pattern service : fonctions exportées (pas de classe) — cf. `stripe_service.ts`, `cloudinary_service.ts`
- Logger : `logger.info({ event: 'xxx', ...context }, 'Message lisible')`
- Validators env : `Env.create('new', { RESEND_API_KEY: Env.schema.string() })`
- Response : pattern `{ success, data/error }` pour les API, mais ici c'est un service interne
- Tests : `@japa/runner`, mock des services externes, `testUtils.db().withGlobalTransaction()`

**Pattern retry existant :**
- `withRetry()` dans `cloudinary_service.ts` — réutilisable si besoin de retry Resend (mais pas nécessaire MVP, Resend a son propre retry)

### Fichiers à créer / modifier

```
Backend — Créer :
siana-memento-api/
├── app/services/email_service.ts
├── database/migrations/xxxx_add_email_sent_at_to_orders_table.ts
└── tests/functional/orders/delivery_email.spec.ts

Backend — Modifier :
siana-memento-api/
├── app/services/stripe_service.ts      (ajouter appel email après ACID)
├── app/models/order.ts                 (ajouter emailSentAt)
├── start/env.ts                        (ajouter RESEND_API_KEY, RESEND_FROM_EMAIL)
├── .env.example                        (ajouter RESEND vars)
└── package.json                        (ajouter resend)
```

### Error codes

| Code | Contexte |
|------|----------|
| `DELIVERY_EMAIL_FAILED` | Erreur Resend (loggé, pas exposé à l'user) |
| `CLOUDINARY_FETCH_FAILED` | Impossible de télécharger l'image HR depuis Cloudinary |

### Design status après cette story

```
draft → generating → completed → paid (story 4-1) → [email envoyé, emailSentAt set]
```

Le status `paid` ne change pas — `emailSentAt` sur Order sert de flag pour la delivery.

### Previous story intelligence (4-1)

**Learnings de la story 4-1 :**
- `request.raw()` fonctionne nativement dans AdonisJS 6 pour le webhook
- Pattern fonctions exportées (pas de classe) dans `stripe_service.ts` — suivre le même pattern pour `email_service.ts`
- `order.designId` est disponible, pas besoin de le passer séparément
- `Design.status` enum a déjà `'paid'` — le design est en `paid` au moment de l'envoi email
- `design.cloudinaryPublicId` contient l'ID de l'original (ex: `designs/design-42`)
- Les 95/95 tests passent après story 4-1 — ne pas casser de régressions
- Le webhook controller est dans `app/controllers/webhooks_controller.ts` — ne pas y toucher, toute la logique est dans `stripe_service.ts`
- `handleCheckoutCompleted` charge déjà `Design` dans la transaction — le réutiliser hors trx pour l'email

### Points d'attention

1. **Pas de double-envoi** : Stripe peut renvoyer le webhook. Le check `emailSentAt` protège contre ça.
2. **Email hors transaction** : L'envoi email ne doit JAMAIS être dans la `db.transaction()`. Un échec email ne doit pas rollback le paiement.
3. **Buffer attachment** : Resend accepte `{ filename: 'save-the-date.png', content: buffer }` dans les attachments. Le buffer est récupéré depuis l'URL Cloudinary originale.
4. **Taille PJ** : L'image 3000x3000px PNG peut peser 5-15 MB. Resend supporte jusqu'à 40 MB de PJ. Pas de souci.
5. **Trim email** : Bug connu (scénario PRD jour 3). TOUJOURS `user.email.trim()` avant envoi.

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2] — User story + ACs originaux
- [Source: _bmad-output/planning-artifacts/prd.md#FR28-FR30] — Delivery email automatique avec fichier HR
- [Source: _bmad-output/planning-artifacts/prd.md#FR42] — Validation email trim
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-I3] — Délivrabilité email >=98%
- [Source: _bmad-output/planning-artifacts/architecture.md#EmailService] — Templates, delivery, retry
- [Source: _bmad-output/planning-artifacts/architecture.md#3.2] — Webhook handling + idempotence
- [Source: siana-memento-api/app/services/stripe_service.ts:54-90] — handleCheckoutCompleted (point d'ancrage)
- [Source: siana-memento-api/app/services/cloudinary_service.ts:64-101] — Upload original + preview watermarquée
- [Source: siana-memento-api/app/models/design.ts:42-43] — cloudinaryPublicId (ID original)
- [Source: siana-memento-api/app/models/order.ts] — Order model (ajouter emailSentAt)
- [Source: siana-memento-api/.env.example:35-36] — RESEND_API_KEY, RESEND_FROM_EMAIL déjà listés
- [Source: siana-memento-web/src/app/actions.ts:3] — Pattern Resend existant (frontend waitlist)
- [Source: _bmad-output/implementation-artifacts/4-1-checkout-stripe.md] — Story 4-1 complète, patterns établis

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- `emailSentAt` retourne `undefined` (pas `null`) sur un Order fraîchement créé sans `refresh()` — Lucid ne set pas les colonnes non-passées dans `create()`. Corrigé dans les tests en ajoutant `order.refresh()` avant assertion.
- Cloudinary correctement configuré dans l'env de test — le test `nonexistent-design-99999` retourne bien un 404 Cloudinary.
- Le service `sendDesignDelivery` ne throw jamais — retourne `{ success: false }` dans tous les cas d'erreur, ce qui permet au webhook de retourner 200.

### Completion Notes List

- Task 1 : Package `resend` installé, `RESEND_API_KEY` + `RESEND_FROM_EMAIL` ajoutés dans `start/env.ts` (déjà dans `.env.example`)
- Task 2 : `email_service.ts` créé — `sendDesignDelivery()` avec fetch Cloudinary original, Resend attachment, email trim, template HTML inline chaleureux avec prénoms/date/RGPD
- Task 3 : Migration `add_email_sent_at_to_orders` — colonne `email_sent_at` nullable sur table `orders`
- Task 4 : Modèle `Order` mis à jour — `emailSentAt: DateTime | null`
- Task 5 : `handleCheckoutCompleted` modifié — appel email post-ACID transaction avec idempotence via `emailSentAt`, refresh order, fire-and-forget
- Task 6 : 7 tests fonctionnels — email trim, null cloudinaryPublicId, Cloudinary 404, emailSentAt lifecycle, idempotence, ACID independence. 115/115 full suite.
- Task 7 : Test manuel à effectuer par Aldo (Stripe CLI + Resend)

### Change Log

- feat(S4-2): email_service.ts — Resend delivery email avec PJ haute résolution
- feat(S4-2): migration add_email_sent_at_to_orders + modèle Order emailSentAt
- feat(S4-2): intégration email dans handleCheckoutCompleted (post-ACID, idempotent)
- feat(S4-2): env.ts — validation RESEND_API_KEY, RESEND_FROM_EMAIL
- test(S4-2): 7 tests delivery_email.spec.ts — trim, erreurs, idempotence, ACID

### File List

**Backend — Créés :**
- `siana-memento-api/app/services/email_service.ts`
- `siana-memento-api/database/migrations/1775141354255_create_add_email_sent_at_to_orders_table.ts`
- `siana-memento-api/tests/functional/orders/delivery_email.spec.ts`

**Backend — Modifiés :**
- `siana-memento-api/app/services/stripe_service.ts`
- `siana-memento-api/app/models/order.ts`
- `siana-memento-api/start/env.ts`
- `siana-memento-api/package.json`
- `siana-memento-api/package-lock.json`
