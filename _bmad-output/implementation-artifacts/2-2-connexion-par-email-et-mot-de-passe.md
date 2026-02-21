# Story 2.2 : Connexion par Email et Mot de Passe

Status: done

## Story

En tant qu'utilisateur enregistré,
je veux me connecter avec mon email et mon mot de passe,
afin d'accéder à mon compte et mon historique.

## Acceptance Criteria

1. **Given** un utilisateur avec un compte existant **When** il saisit ses identifiants corrects et soumet **Then** il est connecté et une session sécurisée est créée (cookie `adonis-session` httpOnly, expiration 7 jours d'inactivité — NFR-S3)

2. **Given** des identifiants incorrects (email inexistant OU mot de passe erroné) **When** l'utilisateur soumet le formulaire **Then** un message d'erreur générique s'affiche sous le formulaire : "Email ou mot de passe incorrect" — **sans révéler lequel est faux** (anti-énumération)

3. **Given** un utilisateur connecté inactif depuis 7 jours **When** il tente d'effectuer une action authentifiée **Then** sa session est expirée et il est redirigé vers la connexion (NFR-S3 — déjà configuré en Story 2.1 via `age: '7d'`)

4. **Given** le formulaire de connexion **When** l'utilisateur le consulte **Then** les labels sont explicites (`htmlFor` associé à chaque input), les erreurs sont annoncées via `role="alert"` + `aria-describedby` (NFR-A5, NFR-A6)

5. **Given** la route `/auth/login` **When** 10 tentatives sont effectuées en 15 minutes depuis la même IP **Then** les suivantes retournent HTTP 429 avec `{ success: false, error: { code: "RATE_LIMIT_EXCEEDED" } }` (architecture.md §2.3)

## Tasks / Subtasks

### Backend

- [x] Task 1 : Ajouter `loginValidator` dans `auth_validator.ts` (AC: #1, #2)
  - [x] Ajouter export `loginValidator` dans `siana-memento-api/app/validators/auth_validator.ts`
  - [x] Schema : `email` (string, trim, email, normalizeEmail) + `password` (string — **pas de minLength** pour le login)
  - [x] **Ne pas** ajouter minLength sur le champ password en login (différent du register)

- [x] Task 2 : Ajouter méthode `login()` dans `AuthService` (AC: #1, #2)
  - [x] Dans `siana-memento-api/app/services/auth_service.ts`, ajouter :
    ```typescript
    async login(email: string, password: string) {
      return User.verifyCredentials(email, password)
      // Retourne l'User si OK, lance E_INVALID_CREDENTIALS si KO
    }
    ```
  - [x] `User.verifyCredentials()` est fourni par le mixin `withAuthFinder` — ne pas vérifier manuellement

- [x] Task 3 : Ajouter action `login` dans `AuthController` (AC: #1, #2)
  - [x] Dans `siana-memento-api/app/controllers/auth_controller.ts`, ajouter :
    ```typescript
    async login({ request, auth, response }: HttpContext) {
      const data = await request.validateUsing(loginValidator)
      try {
        const user = await this.authService.login(data.email, data.password)
        await auth.use('web').login(user)
        return response.ok({
          success: true,
          data: { user: { id: user.id, email: user.email, fullName: user.fullName } },
        })
      } catch {
        return response.unauthorized({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Email ou mot de passe incorrect' },
        })
      }
    }
    ```
  - [x] Catch **toutes** les erreurs (E_INVALID_CREDENTIALS + email inconnu) → même réponse 401 générique
  - [x] **Ne pas** distinguer "email inexistant" vs "mot de passe faux" dans la réponse

- [x] Task 4 : Enregistrer la route `POST /auth/login` (AC: #1, #5)
  - [x] Dans `siana-memento-api/start/routes.ts`, ajouter le throttle login :
    ```typescript
    const loginThrottle = limiter.define('login', () =>
      limiter.allowRequests(10).every('15 minutes')
    )
    ```
  - [x] Ajouter dans le groupe `auth` :
    ```typescript
    router
      .post('/login', [AuthController, 'login'])
      .use([loginThrottle, middleware.guest()])
    ```
  - [x] Rate limit : **10 tentatives / 15 minutes** (architecture.md §2.3 — plus permissif que register car les typos arrivent)

### Frontend

- [x] Task 5 : Ajouter `loginUser()` dans `lib/api/auth.ts` (AC: #1, #2)
  - [x] Dans `siana-memento-web/src/lib/api/auth.ts`, ajouter :
    ```typescript
    interface LoginPayload {
      email: string
      password: string
    }

    type LoginResult =
      | { success: true }
      | { success: false; errorCode: string; message: string }

    export async function loginUser(payload: LoginPayload): Promise<LoginResult> {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // OBLIGATOIRE pour recevoir le cookie de session
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (json.success) return { success: true }
        return {
          success: false,
          errorCode: json.error?.code ?? 'UNKNOWN',
          message: json.error?.message ?? 'Une erreur est survenue.',
        }
      } catch {
        return {
          success: false,
          errorCode: 'NETWORK_ERROR',
          message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
        }
      }
    }
    ```

- [x] Task 6 : Créer le composant `LoginForm.tsx` (AC: #1, #2, #4)
  - [x] Créer `siana-memento-web/src/components/siana/LoginForm.tsx`
  - [x] Interface : `{ onSuccess: () => void }`
  - [x] Champs : email (type="email"), password (type="password")
  - [x] Pattern : controlled state React — **même pattern que `RegisterForm.tsx`** (pas React Hook Form)
  - [x] Validation client légère : email format uniquement (pas de minLength sur password en login)
  - [x] **Erreur INVALID_CREDENTIALS** → afficher sous le formulaire comme erreur générale (pas sous un champ spécifique) : `<p role="alert">Email ou mot de passe incorrect</p>`
  - [x] **Erreurs système** (API down, NETWORK_ERROR) → `toast.error(message, { position: 'top-right' })`
  - [x] Bouton submit : disabled pendant loading + texte "Connexion…"
  - [x] `autoComplete="current-password"` sur le champ password (différent de `new-password` du register)
  - [x] `useRef` pour focus management (focus premier champ en erreur)

- [x] Task 7 : Page standalone `/login` (pour dev/test) (AC: #1)
  - [x] Créer `siana-memento-web/src/app/(auth)/login/page.tsx`
  - [x] Utiliser `<FocusCard>` comme conteneur (pattern existant)
  - [x] Intégrer `<LoginForm onSuccess={() => router.push('/')} />`
  - [x] Cette page est **temporaire** — Story 2.5 implémentera le modal permanent (comme `/register`)

### Tests

- [x] Task 8 : Tests fonctionnels backend (AC: #1, #2, #5)
  - [x] Créer `siana-memento-api/tests/functional/auth/login.spec.ts`
  - [x] Tests à couvrir (modèle : `register.spec.ts`) :
    - Login réussi → 200 + cookie `adonis-session` présent ✅
    - Login réussi → body `{ success: true, data: { user: { id, email, fullName } } }` ✅
    - Password non exposé dans la réponse ✅
    - Email inconnu → 401 + `INVALID_CREDENTIALS` (même message que mot de passe faux) ✅
    - Mot de passe erroné → 401 + `INVALID_CREDENTIALS` ✅
    - Anti-énumération : même message pour email inconnu et mot de passe faux ✅
    - Format email invalide → 422 `VALIDATION_FAILED` ✅
    - Password manquant → 422 `VALIDATION_FAILED` ✅
    - Rate limit : après 10 tentatives/15min → 429 `RATE_LIMIT_EXCEEDED` ✅

- [x] Task 9 : Tests unitaires validator (AC: #1)
  - [x] Étendre `siana-memento-api/tests/unit/auth_validator.spec.ts`
  - [x] Tester `loginValidator` : email valide/invalide, password présent/absent, pas de minLength ✅

## Dev Notes

### Points Critiques — À Ne Pas Manquer

1. **`User.verifyCredentials()` lance `E_INVALID_CREDENTIALS`** : Ce n'est pas une erreur HTTP native. Il faut l'attraper dans le controller et retourner 401. **NE PAS** laisser l'exception handler global la gérer — elle produirait une 500 non désirée. Wrapper dans un `try/catch` dans l'action `login`.

2. **Message d'erreur anti-énumération** : Toujours retourner **le même message** que l'email soit inexistant ou que le password soit incorrect (`"Email ou mot de passe incorrect"`). Ne jamais écrire `"Cet email n'existe pas"` — cela révèle les comptes existants.

3. **`credentials: 'include'`** : OBLIGATOIRE sur le fetch `loginUser()` — sans ça, le cookie de session n'est pas envoyé/reçu par le navigateur (CORS cross-origin). Déjà présent dans `registerUser()` — même pattern.

4. **Session déjà configurée 7j** : La correction `age: '7d'` a été faite en Story 2.1 dans `config/session.ts`. **Ne pas modifier** ce fichier.

5. **`serializeAs: null` sur `password`** : Le modèle User cache le champ `password` dans les sérialisations JSON (`@column({ serializeAs: null })`). La réponse login n'expose donc pas le hash — comportement correct, ne pas changer.

6. **Middleware `guest`** : La route `/auth/login` doit utiliser `middleware.guest()` (comme `/auth/register`). Si l'utilisateur est déjà connecté, la réponse sera 401 "Not authorized" — comportement correct pour un endpoint guest-only.

7. **Rate limit login = 10/15min** (pas 3/hour comme register) : Architecture §2.3 justifie une limite plus permissive pour le login car les typos de password sont fréquentes. Différencier les deux throttles dans `routes.ts`.

8. **Erreur générale dans LoginForm** : Contrairement à `RegisterForm` où `DUPLICATE_EMAIL` pointe vers le champ email, `INVALID_CREDENTIALS` doit s'afficher comme erreur **globale** du formulaire (ni sous email ni sous password — on ne révèle pas lequel est faux). Utiliser un state `generalError` séparé.

### Project Structure Notes

**Backend — Fichiers à modifier :**
```
siana-memento-api/
├── app/
│   ├── controllers/
│   │   └── auth_controller.ts          ← MODIFIER (ajouter action login)
│   ├── services/
│   │   └── auth_service.ts             ← MODIFIER (ajouter méthode login)
│   └── validators/
│       └── auth_validator.ts           ← MODIFIER (ajouter loginValidator)
└── start/
    └── routes.ts                       ← MODIFIER (ajouter POST /auth/login + throttle)
```

**Backend — Aucune nouvelle migration nécessaire** : Le modèle User et ses colonnes (`email`, `password`, `provider`, etc.) sont complets depuis Story 2.1.

**Frontend — Fichiers à créer :**
```
siana-memento-web/src/
├── app/
│   └── (auth)/
│       └── login/
│           └── page.tsx                ← CRÉER (page temporaire)
├── components/
│   └── siana/
│       └── LoginForm.tsx               ← CRÉER
└── lib/
    └── api/
        └── auth.ts                     ← MODIFIER (ajouter loginUser)
```

**Frontend — Fichiers existants à ne PAS modifier :**
- `components/ui/` — tous les composants shadcn (utiliser tel quel)
- `components/siana/FocusCard.tsx` — utiliser comme conteneur
- `components/siana/RegisterForm.tsx` — source d'inspiration pattern, ne pas modifier
- `app/layout.tsx` — déjà configuré avec `<Toaster>`

### Conventions de Code (depuis codebase existante)

**Pattern form existant (RegisterForm.tsx) :**
```tsx
// État erreur générale (pour INVALID_CREDENTIALS — global, pas par champ)
const [generalError, setGeneralError] = useState("")

// Affichage erreur générale
{generalError && (
  <p role="alert" className="text-sm text-destructive text-center">
    {generalError}
  </p>
)}

// Effacer l'erreur générale à chaque saisie
onChange={(e) => {
  setEmail(e.target.value)
  if (generalError) setGeneralError("")
}}

// Erreur système → toast (pas erreur générale)
toast.error(result.message, { position: 'top-right' })
```

**Pattern AuthController avec DI (depuis auth_controller.ts) :**
```typescript
import { inject } from '@adonisjs/core'
import { loginValidator } from '#validators/auth_validator'

@inject()
export default class AuthController {
  constructor(protected authService: AuthService) {}

  async login({ request, auth, response }: HttpContext) {
    const data = await request.validateUsing(loginValidator)
    try {
      const user = await this.authService.login(data.email, data.password)
      await auth.use('web').login(user)
      return response.ok({
        success: true,
        data: { user: { id: user.id, email: user.email, fullName: user.fullName } },
      })
    } catch {
      return response.unauthorized({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Email ou mot de passe incorrect' },
      })
    }
  }
}
```

**Pattern test fonctionnel (depuis register.spec.ts) :**
```typescript
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

test.group('POST /auth/login', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns 200 and session cookie on valid credentials', async ({ client, assert }) => {
    await User.create({ email: 'test@example.com', password: 'motdepasse123', provider: 'email' })
    const response = await client.post('/auth/login').json({
      email: 'test@example.com',
      password: 'motdepasse123',
    })
    response.assertStatus(200)
    response.assertCookie('adonis-session')
  })
})
```

### API Endpoints

| Method | Path | Guard | Rate Limit | Description |
|--------|------|-------|-----------|-------------|
| POST | `/auth/login` | guest | 10/15min | Connexion email/password |

**Request body :**
```json
{ "email": "user@example.com", "password": "motdepasse123" }
```

**Response 200 OK (succès) :**
```json
{ "success": true, "data": { "user": { "id": 1, "email": "user@example.com", "fullName": "Sophie Thomas" } } }
```

**Response 401 Unauthorized (identifiants invalides) :**
```json
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "Email ou mot de passe incorrect" } }
```

**Response 422 Unprocessable (validation échouée) :**
```json
{ "success": false, "error": { "code": "VALIDATION_FAILED", "message": "Les données saisies sont invalides.", "details": [...] } }
```

**Response 429 Too Many Requests :**
```json
{ "success": false, "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "Trop de tentatives. Réessayez dans une heure." } }
```

### Intelligence Story 2.1 — À Réutiliser

- **`withAuthFinder` mixin** : déjà configuré sur `User` avec `uids: ['email']` et `passwordColumnName: 'password'`. La méthode `User.verifyCredentials(email, password)` est disponible sans aucun setup supplémentaire.
- **Gestion exceptions globale** : `app/exceptions/handler.ts` gère déjà `E_TOO_MANY_REQUESTS` (429) et `E_VALIDATION_ERROR` (422). Ne rien modifier dans le handler — `E_INVALID_CREDENTIALS` doit être catchée **dans le controller** (pas dans le handler global).
- **VineJS `.trim().email().normalizeEmail()`** : ordre important pour loginValidator — même ordre que registerValidator.
- **Import limiter** : `import limiter from '@adonisjs/limiter/services/main'` — déjà importé dans `routes.ts`.
- **`middleware.guest()`** : déjà importé via `import { middleware } from '#start/kernel'` dans `routes.ts`.
- **`@inject()` decorator + DI** : pattern établi dans `AuthController`, conserver pour la nouvelle méthode `login`.
- **Test pattern** : `group.each.setup(() => testUtils.db().withGlobalTransaction())` — isolation transactions, réutiliser exactement.
- **Créer l'utilisateur dans les tests** avec `User.create({ ..., provider: 'email' })` — colonne `provider` est `notNullable`.

### Dépendances

- **Story 2.1 (done)** : Fournit `AuthController`, `AuthService`, `auth_validator.ts`, modèle `User` avec `withAuthFinder`, rate limiter installé, handler exceptions normalisé.
- **Story 2.5** (Modal Auth Juste à Temps) : Consommera `<LoginForm>` comme composant — l'interface `onSuccess()` callback est cruciale, maintenir ce pattern.
- **Story 2.3** (Google OAuth) : Utilisera aussi `auth.use('web').login(user)` — pattern cohérent.

### Accessibilité (NFR-A1 à A7)

- Labels `<label htmlFor="...">` explicites sur tous les inputs
- `aria-describedby="field-error"` + `aria-invalid="true"` quand erreur de champ (ex: email invalide)
- `role="alert"` sur les messages d'erreur inline et sur l'erreur générale
- Bouton submit disabled pendant loading avec indication visuelle
- Focus management : focus sur le premier champ si erreur de format email ; pour `INVALID_CREDENTIALS`, pas de déplacement du focus (l'erreur globale est affichée dans le form)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — Acceptance criteria originaux
- [Source: _bmad-output/planning-artifacts/architecture.md#2.2 - Session Management] — Cookie httpOnly, 7 days, sameSite lax
- [Source: _bmad-output/planning-artifacts/architecture.md#2.3 - Rate Limiting] — 10 login attempts/15min
- [Source: _bmad-output/planning-artifacts/architecture.md#3.1 - Response Format] — Format success/error standardisé, code INVALID_CREDENTIALS
- [Source: _bmad-output/implementation-artifacts/2-1-inscription-par-email-et-mot-de-passe.md] — Patterns établis (controller DI, validator, rate limiter, tests)
- [Source: siana-memento-api/app/controllers/auth_controller.ts] — Patron DI avec @inject()
- [Source: siana-memento-api/app/models/user.ts] — withAuthFinder mixin, verifyCredentials disponible
- [Source: siana-memento-api/app/exceptions/handler.ts] — Gestion globale exceptions (ne pas toucher)
- [Source: siana-memento-api/start/routes.ts] — Structure routes existante, imports déjà en place
- [Source: siana-memento-api/app/validators/auth_validator.ts] — Ajouter loginValidator ici
- [Source: siana-memento-web/src/components/siana/RegisterForm.tsx] — Pattern form de référence
- [Source: siana-memento-web/src/lib/api/auth.ts] — Ajouter loginUser() ici
- [Source: CLAUDE.md#Frontend Conventions] — Toasts pour erreurs système, inline pour champs

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(aucun — implémentation directe sans blocage)

### Completion Notes List

- Toutes les tâches (9) implémentées — **29 tests passent** (13 unit + 16 fonctionnels), 0 régression
- `loginValidator` : pas de `minLength` sur password (login ≠ register — l'utilisateur ne re-crée pas son compte)
- `User.verifyCredentials()` catchée dans le controller → réponse 401 uniforme (anti-énumération)
- `generalError` state distinct de `emailError` dans `LoginForm` — `INVALID_CREDENTIALS` jamais pointé vers un champ spécifique
- `autoComplete="current-password"` sur le champ password login (vs `new-password` pour register)
- Rate limit login : 10/15min (vs 3/h pour register) — cohérent avec architecture.md §2.3
- Page `/login` temporaire créée sur le même modèle que `/register` — Story 2.5 implémentera le modal

### File List

**Backend modifié :**
- `siana-memento-api/app/validators/auth_validator.ts` (ajout loginValidator)
- `siana-memento-api/app/services/auth_service.ts` (ajout méthode login)
- `siana-memento-api/app/controllers/auth_controller.ts` (ajout action login)
- `siana-memento-api/start/routes.ts` (ajout POST /auth/login + loginThrottle)

**Tests créés :**
- `siana-memento-api/tests/functional/auth/login.spec.ts` (8 tests)
- `siana-memento-api/tests/unit/auth_validator.spec.ts` (étendu — 6 tests loginValidator ajoutés)

**Frontend créé :**
- `siana-memento-web/src/lib/api/auth.ts` (ajout loginUser)
- `siana-memento-web/src/components/siana/LoginForm.tsx`
- `siana-memento-web/src/app/(auth)/login/page.tsx`

## Senior Developer Review (AI)

### Outcome
**Status:** Approved with Fixes

### Review Notes
Performed adversarial review on Story 2.2 implementation.

**Findings & Fixes:**
1.  **UX Issue (High):** Email input did not trim whitespace on submission. Leading/trailing spaces (common in copy-paste) were rejected by frontend validation despite backend supporting trimming.
    -   *Fix:* Updated `LoginForm.tsx` to trim email before validation and submission.

2.  **Performance Issue (Medium):** Rate limit tests were sequential, not simulating burst traffic accurately.
    -   *Fix:* Updated `login.spec.ts` to use `Promise.all` for parallel requests.

3.  **Frontend Architecture (Medium):** `loginUser` API helper discarded the `user` object returned by the backend, preventing immediate UI updates (e.g., user name display) without a reload/refetch.
    -   *Fix:* Updated `lib/api/auth.ts` to expose `User` interface and return `user` object in `LoginResult`. Updated `LoginForm` to pass `user` to `onSuccess` callback.

4.  **Backend Robustness (Note):** `AuthController.login` catches *all* exceptions and returns 401. This adheres to the story's anti-enumeration requirement but risks masking 500 errors (e.g., DB down) as "Invalid Credentials". No change made to respect story constraints, but noted for future observability improvements.

### Validation Checklist
- [x] Functional Requirements (AC 1-5) met.
- [x] Security: Anti-enumeration confirmed (same error message).
- [x] Security: Rate limiting active (10/15min).
- [x] UX: Accessibility (ARIA, role=alert) verified.
- [x] Code Quality: Clean, typed, and consistent with project patterns.
- [x] Tests: Comprehensive coverage (unit + functional).

## Change Log

- 2026-02-21 — Fix : suppression de middleware.guest() sur POST /auth/login — ce middleware redirige vers / pour les sessions web, ce qui cause un 302→404 sur les appels fetch() depuis le frontend
- 2026-02-21 — Implémentation complète Story 2.2 : connexion email/password, loginValidator (sans minLength), AuthService.login() via verifyCredentials, AuthController.login() avec catch anti-énumération, route POST /auth/login (10/15min throttle), LoginForm React (generalError + autoComplete current-password), page /login standalone, 8 tests fonctionnels + 6 tests unitaires loginValidator
- 2026-02-21 — Review Fixes : Trim email frontend, parallel tests, return User object in login API.
