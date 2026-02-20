# Story 2.1 : Inscription par Email et Mot de Passe

Status: done

## Story

En tant que visiteur,
je veux créer un compte avec mon email et un mot de passe,
afin d'accéder aux fonctionnalités réservées aux utilisateurs connectés.

## Acceptance Criteria

1. **Given** un visiteur sur le formulaire d'inscription **When** il saisit un email valide et un mot de passe (≥8 caractères) et soumet **Then** un compte est créé, le mot de passe est hashé avec scrypt et l'utilisateur est connecté automatiquement via session (NFR-S2)

2. **Given** un email déjà enregistré **When** le visiteur tente de s'inscrire avec ce même email **Then** un message d'erreur clair s'affiche sous le champ email : "Un compte existe déjà avec cet email"

3. **Given** un compte créé **When** j'inspecte la base de données **Then** le mot de passe est hashé (non lisible en clair) — hash scrypt via AdonisJS built-in

4. **Given** une inscription réussie **When** la session est établie **Then** la session expire après 7 jours d'inactivité (NFR-S3) — la config session.ts doit être mise à jour de `'2h'` à `'7d'`

5. **Given** un formulaire d'inscription **When** l'utilisateur le consulte **Then** les labels sont explicites et associés à chaque input, les erreurs sont annoncées via aria-live (NFR-A5, NFR-A6)

## Tasks / Subtasks

### Backend

- [x] Task 1 : Corriger la config session (AC: #4)
  - [x] Dans `siana-memento-api/config/session.ts`, changer `age: '2h'` → `age: '7d'`

- [x] Task 2 : Migration User — champs manquants (AC: #1, #3)
  - [x] Créer une nouvelle migration `node ace make:migration alter_users_add_auth_fields`
  - [x] Ajouter colonne `provider` : `table.string('provider').notNullable().defaultTo('email')` (valeurs : 'email', 'google' — pour Story 2.3)
  - [x] Ajouter colonne `provider_id` : `table.string('provider_id').nullable()` (pour OAuth Story 2.3)
  - [x] Rendre `password` nullable : `table.string('password').nullable().alter()` (Google OAuth n'a pas de password)
  - [x] **Ne pas** supprimer ni modifier les colonnes existantes (`full_name`, `email`, `password`, timestamps)

- [x] Task 3 : Mettre à jour le modèle User (AC: #1)
  - [x] Ajouter colonnes `provider` et `providerId` au modèle `app/models/user.ts`
  - [x] Rendre `password` nullable dans le type TypeScript (`declare password: string | null`)

- [x] Task 4 : Créer le validator d'inscription (AC: #1, #2)
  - [x] Créer `siana-memento-api/app/validators/auth_validator.ts`
  - [x] Schema `registerValidator` : `email` (string, email, trim, unique users), `password` (string, minLength 8), `fullName` (string, optional, trim)
  - [x] Messages d'erreur en français

- [x] Task 5 : Créer AuthService (AC: #1, #2)
  - [x] Créer `siana-memento-api/app/services/auth_service.ts`
  - [x] Méthode `register(data: { email, password, fullName? })` : crée l'User via Lucid, retourne l'User
  - [x] Méthode `findByEmail(email: string)` : lookup pour vérifier unicité
  - [x] Le hash est géré automatiquement par le modèle via `AuthFinder` mixin — ne pas hasher manuellement

- [x] Task 6 : Créer AuthController (AC: #1, #2)
  - [x] Créer `siana-memento-api/app/controllers/auth_controller.ts`
  - [x] Action `register(ctx)` :
    1. Valider payload avec `registerValidator`
    2. Vérifier email unique → si doublon, retourner `422` avec `DUPLICATE_EMAIL`
    3. Créer user via `AuthService.register()`
    4. Login automatique : `await auth.use('web').login(user)`
    5. Retourner `{ success: true, data: { user: { id, email, fullName } } }`
  - [x] Gestion erreurs : `{ success: false, error: { code, message } }`

- [x] Task 7 : Enregistrer la route (AC: #1)
  - [x] Dans `siana-memento-api/start/routes.ts`, ajouter sous le groupe `auth` :
    - `POST /auth/register` → `AuthController.register`
    - Middleware : `guest` (bloquer si déjà connecté)

- [x] Task 8 : Rate limiting (sécurité)
  - [x] Appliquer rate limiter sur `/auth/register` : 3 tentatives/heure (via `@adonisjs/limiter`)
  - [x] Réponse 429 avec `{ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Trop de tentatives. Réessayez dans une heure.' } }`

### Frontend

- [x] Task 9 : Créer le composant RegisterForm (AC: #1, #2, #5)
  - [x] Créer `siana-memento-web/src/components/siana/RegisterForm.tsx`
  - [x] Champs : email (type="email"), password (type="password"), optionnel fullName
  - [x] Pattern : controlled state React (comme WaitlistForm.tsx — PAS React Hook Form pour MVP)
  - [x] Validation client légère : email format + password ≥8 chars
  - [x] Erreurs inline sous chaque champ via `<p id="xxx-error" role="alert">` + `aria-describedby` sur l'input
  - [x] Erreur système (API down) → `toast.error(message, { position: 'top-right' })`
  - [x] Bouton submit : disabled pendant loading + texte "Inscription…"
  - [x] Après succès : callback `onSuccess()` (le parent (Story 2.5 modal) décide de la navigation)

- [x] Task 10 : Créer l'API client auth (AC: #1)
  - [x] Créer `siana-memento-web/src/lib/api/auth.ts`
  - [x] Fonction `registerUser(data: { email, password, fullName? })` : appel `POST {NEXT_PUBLIC_API_URL}/auth/register` avec `credentials: 'include'` (pour recevoir le cookie de session)
  - [x] Retourner `{ success: true }` ou `{ success: false, errorCode: string, message: string }`

- [x] Task 11 : Page d'inscription standalone (pour dev/test)
  - [x] Créer `siana-memento-web/src/app/(auth)/register/page.tsx`
  - [x] Utiliser `<FocusCard>` comme conteneur (pattern existant)
  - [x] Intégrer `<RegisterForm onSuccess={() => router.push('/')} />`
  - [x] Cette page est temporaire — Story 2.5 implémentera le modal permanent

## Dev Notes

### Points Critiques — À Ne Pas Manquer

1. **Session age DOIT être corrigé** : `siana-memento-api/config/session.ts` ligne 19 → changer `age: '2h'` en `age: '7d'`. C'est un bug de config du starter — la spec exige 7 jours (NFR-S3).

2. **Hash utilisé = scrypt** (pas bcrypt) : le starter AdonisJS 6 configure `scrypt` dans `config/hash.ts`. C'est correct et conforme à NFR-S2. Ne PAS changer pour bcrypt. Le hash est géré **automatiquement** par le mixin `withAuthFinder` sur le modèle — ne jamais hasher manuellement dans le controller ou service.

3. **Unicité email** : La migration `1771510351689_create_users_table.ts` pose déjà `email.unique()`. La contrainte DB existe. Cependant, vérifier côté applicatif AVANT d'insérer pour retourner un message d'erreur propre (pas une exception DB brute).

4. **NFR-S6 — Chiffrement email au repos** : L'architecture spécifie que l'email doit être chiffré en base. Pour le MVP, cette feature est **reportée (// TODO Growth)** car elle complexifie les queries (lookup par email hashé + valeur chiffrée). Documenter comme `// TODO Growth: encrypt email at rest (NFR-S6) — requires lookup_hash column`. Ne pas implémenter maintenant.

5. **`credentials: 'include'`** : OBLIGATOIRE sur tous les appels API frontend qui nécessitent la session. Sans ça, le cookie de session n'est pas envoyé/reçu par le navigateur (CORS cross-origin).

6. **fullName optionnel pour l'inscription email** : Le visiteur n'a pas forcément de nom. Le champ est nullable en base. Ne pas le rendre obligatoire dans le formulaire d'inscription (contrairement à OAuth Google qui peut le pré-remplir).

### Project Structure Notes

**Backend — Fichiers à créer :**
```
siana-memento-api/
├── app/
│   ├── controllers/
│   │   └── auth_controller.ts          ← CRÉER
│   ├── services/
│   │   └── auth_service.ts             ← CRÉER
│   └── validators/
│       └── auth_validator.ts           ← CRÉER
├── database/
│   └── migrations/
│       └── {timestamp}_alter_users_add_auth_fields.ts  ← CRÉER
├── config/
│   └── session.ts                      ← MODIFIER (age: '2h' → '7d')
└── start/
    └── routes.ts                       ← MODIFIER (ajouter /auth/register)
```

**Frontend — Fichiers à créer :**
```
siana-memento-web/src/
├── app/
│   └── (auth)/
│       └── register/
│           └── page.tsx                ← CRÉER (page temporaire)
├── components/
│   └── siana/
│       └── RegisterForm.tsx            ← CRÉER
└── lib/
    └── api/
        └── auth.ts                     ← CRÉER
```

**Frontend — Fichiers existants à ne PAS modifier :**
- `components/ui/` — tous les composants shadcn (utiliser tel quel)
- `components/siana/FocusCard.tsx` — utiliser comme conteneur de page
- `app/layout.tsx` — déjà configuré avec `<Toaster>`

### Conventions de Code (depuis codebase existante)

**Pattern form existant (WaitlistForm.tsx) :**
```tsx
// Contrôle React state simple — utiliser ce pattern
const [fieldError, setFieldError] = useState("");

// Erreur champ inline
<p id="email-error" role="alert" className="text-sm text-destructive">
  {fieldError}
</p>

// Erreur système
toast.error(message, { position: 'top-right' });

// Accessibilité
<input aria-describedby={fieldError ? "email-error" : undefined} aria-invalid={!!fieldError} />
```

**Pattern API response (architecture.md) :**
```typescript
// Success
{ "success": true, "data": { "user": { "id": 1, "email": "...", "fullName": "..." } } }

// Error
{ "success": false, "error": { "code": "DUPLICATE_EMAIL", "message": "Un compte existe déjà avec cet email" } }
{ "success": false, "error": { "code": "VALIDATION_FAILED", "message": "...", "details": { ... } } }
{ "success": false, "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "Trop de tentatives..." } }
```

**AdonisJS AuthController pattern :**
```typescript
import { HttpContext } from '@adonisjs/core/http'
import { registerValidator } from '#validators/auth_validator'
import AuthService from '#services/auth_service'

export default class AuthController {
  async register({ request, auth, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)
    // ... logique
    await auth.use('web').login(user)
    return response.created({ success: true, data: { user: { id: user.id, email: user.email } } })
  }
}
```

**VineJS validator example (depuis architecture) :**
```typescript
import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    password: vine.string().minLength(8),
    fullName: vine.string().trim().optional(),
  })
)
```

### API Endpoints

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| POST | `/auth/register` | guest | Inscription email/password |

**Request body :**
```json
{ "email": "user@example.com", "password": "motdepasse123", "fullName": "Sophie Thomas" }
```

**Response 201 Created :**
```json
{ "success": true, "data": { "user": { "id": 1, "email": "user@example.com", "fullName": "Sophie Thomas" } } }
```

**Response 422 Unprocessable :**
```json
{ "success": false, "error": { "code": "DUPLICATE_EMAIL", "message": "Un compte existe déjà avec cet email" } }
```

### Accessibilité (NFR-A1 à A7)

- Labels `<label htmlFor="...">` explicites sur tous les inputs
- `aria-describedby="field-error"` + `aria-invalid="true"` quand erreur
- `role="alert"` sur les messages d'erreur inline
- Bouton submit désactivé avec indication visuelle pendant le chargement
- Focus management : premier champ en erreur reprend le focus après soumission

### Dépendances Stories

- **Story 2.5** (Modal Auth Juste à Temps) consomme `<RegisterForm>` comme composant — l'interface `onSuccess()` callback est cruciale
- **Story 2.2** (Login) utilisera le même `AuthController` et `AuthService` — préparer la structure en conséquence
- **Story 2.3** (Google OAuth) utilisera les champs `provider` et `provider_id` ajoutés dans la migration de cette story

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#2.1 - OAuth Google] — Ally Google Provider
- [Source: _bmad-output/planning-artifacts/architecture.md#2.2 - Session Management] — Cookie httpOnly, 7 days, sameSite lax
- [Source: _bmad-output/planning-artifacts/architecture.md#2.3 - Rate Limiting] — 3 register/hour
- [Source: _bmad-output/planning-artifacts/architecture.md#3.1 - Response Format] — Format success/error standardisé
- [Source: _bmad-output/planning-artifacts/architecture.md#1.3 - Data Validation] — VineJS centralisé
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — Acceptance criteria originaux
- [Source: siana-memento-api/config/session.ts#19] — Bug session age '2h' → corriger en '7d'
- [Source: siana-memento-api/config/hash.ts] — scrypt configuré (pas bcrypt)
- [Source: siana-memento-api/app/models/user.ts] — Modèle User existant avec AuthFinder mixin
- [Source: siana-memento-web/src/components/siana/WaitlistForm.tsx] — Pattern form référence
- [Source: CLAUDE.md#Frontend Conventions] — Toasts pour erreurs système, inline pour champs

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- VineJS `.email()` valide avant `.trim()` → réordonner en `.trim().email()` pour accepter les emails avec espaces
- `E_TOO_MANY_REQUESTS` export : `import { errors as limiterErrors } from '@adonisjs/limiter'` (pas d'export nommé direct)
- Tests fonctionnels : ajouter `client` dans la déstructuration de chaque test qui utilise `client.post()`

### Completion Notes List

- Toutes les tâches (11) implémentées et testées — 14 tests passent (7 unit + 7 functional)
- `@adonisjs/limiter` installé et configuré avec store `database`, migration `rate_limits` créée
- Handler d'exceptions global normalisé pour `ValidationException` (VALIDATION_FAILED) et `ThrottleException` (RATE_LIMIT_EXCEEDED)
- VineJS validator : ordre `.trim().email()` critique (trim avant validation email)
- Hash scrypt géré automatiquement par `withAuthFinder` mixin — aucun hash manuel dans controller/service
- `password` rendu nullable en DB pour préparer OAuth Google (Story 2.3)
- `RegisterForm` utilise le pattern WaitlistForm.tsx (controlled state, aria, focus management)
- Page `/register` est temporaire — Story 2.5 implémentera le modal permanent
- **Code Review (2026-02-20):** Refactored `AuthController` to use Dependency Injection. Updated functional tests to verify session cookie and rate limiting. `package.json` and `lock` file added to tracked changes.

### File List

**Backend modifié :**
- `siana-memento-api/config/session.ts` (age: '2h' → '7d')
- `siana-memento-api/adonisrc.ts` (limiter_provider ajouté)
- `siana-memento-api/app/models/user.ts` (provider, providerId, password nullable)
- `siana-memento-api/app/exceptions/handler.ts` (ValidationException + ThrottleException)
- `siana-memento-api/start/routes.ts` (POST /auth/register + rate limiting)
- `siana-memento-api/package.json` (AdonisJS dependencies)
- `siana-memento-api/package-lock.json`

**Backend créé :**
- `siana-memento-api/database/migrations/1771590590300_alter_users_add_auth_fields.ts`
- `siana-memento-api/database/migrations/1771590590400_create_rate_limits_table.ts`
- `siana-memento-api/app/validators/auth_validator.ts`
- `siana-memento-api/app/services/auth_service.ts`
- `siana-memento-api/app/controllers/auth_controller.ts`
- `siana-memento-api/config/limiter.ts`

**Tests créés :**
- `siana-memento-api/tests/unit/auth_validator.spec.ts` (7 tests)
- `siana-memento-api/tests/functional/auth/register.spec.ts` (8 tests)

**Frontend créé :**
- `siana-memento-web/src/lib/api/auth.ts`
- `siana-memento-web/src/components/siana/RegisterForm.tsx`
- `siana-memento-web/src/app/(auth)/register/page.tsx`

## Change Log

- 2026-02-20 — Code Review Fixes: DI in AuthController, improved test coverage (session cookie, rate limiting).
- 2026-02-20 — Implémentation complète Story 2.1 : inscription email/password, migration users (provider + provider_id + password nullable), AuthService, AuthController, validator VineJS, rate limiting @adonisjs/limiter, RegisterForm React, page /register standalone, 14 tests (7 unit + 7 functional)
