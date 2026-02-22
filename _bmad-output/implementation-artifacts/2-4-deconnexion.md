# Story 2.4 : Déconnexion

Status: done

## Story

En tant qu'utilisateur connecté,
je veux me déconnecter,
afin que ma session soit terminée de manière sécurisée.

## Acceptance Criteria

1. **Given** un utilisateur connecté **When** il clique sur "Se déconnecter" **Then** sa session est invalidée côté serveur et le cookie de session est supprimé (FR5)

2. **Given** une session invalidée **When** l'utilisateur tente d'accéder à une page protégée **Then** il est redirigé vers la page de connexion (NFR-S3)

3. **Given** un appel `POST /auth/logout` sans session active (session déjà expirée) **When** la requête arrive **Then** le serveur répond 200 `{ success: true }` sans erreur — comportement gracieux idempotent

## Tasks / Subtasks

### Backend — Endpoint logout

- [x] Task 1 : Ajouter `logout()` dans `AuthController` (AC: #1, #3)
  - [x] Dans `siana-memento-api/app/controllers/auth_controller.ts`, ajouter la méthode suivante après `me()` :
    ```typescript
    async logout({ auth, response }: HttpContext) {
      await auth.use('web').logout()
      return response.ok({ success: true })
    }
    ```
  - [x] **Pas de `middleware.auth()`** sur cette route — si la session est déjà expirée, `logout()` est idempotent et retourne toujours 200 (meilleure UX, évite les 401 en cascade)
  - [x] `auth.use('web').logout()` détruit la session côté serveur ET invalide le cookie `adonis-session` dans la réponse HTTP (header `Set-Cookie` avec expiration dans le passé)

- [x] Task 2 : Enregistrer la route `POST /auth/logout` (AC: #1)
  - [x] Dans `siana-memento-api/start/routes.ts`, dans le groupe `.prefix('/auth')`, ajouter :
    ```typescript
    router.post('/logout', [AuthController, 'logout'])
    ```
  - [x] **Pas de rate limiter** — la déconnexion n'est pas une surface d'attaque
  - [x] **Pas de `middleware.guest()`** ni `middleware.auth()` — ouvert intentionnellement pour comportement idempotent
  - [x] Placement recommandé : après la route `/me`, avant la fermeture du groupe

### Frontend — Fonction API

- [x] Task 3 : Ajouter `logoutUser()` dans `lib/api/auth.ts` (AC: #1)
  - [x] Dans `siana-memento-web/src/lib/api/auth.ts`, ajouter à la fin du fichier :
    ```typescript
    type LogoutResult =
      | { success: true }
      | { success: false; errorCode: string }

    export async function logoutUser(): Promise<LogoutResult> {
      try {
        const res = await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        })
        const json = await res.json()
        if (json.success) return { success: true }
        return { success: false, errorCode: json.error?.code ?? 'LOGOUT_FAILED' }
      } catch {
        return { success: false, errorCode: 'NETWORK_ERROR' }
      }
    }
    ```
  - [x] `credentials: 'include'` obligatoire — le cookie `adonis-session` doit être envoyé avec la requête pour que le serveur identifie et détruise la session

### Frontend — Composant LogoutButton

- [x] Task 4 : Créer `LogoutButton.tsx` dans `/components/siana/` (AC: #1, #2)
  - [x] Créer `siana-memento-web/src/components/siana/LogoutButton.tsx` :
    ```tsx
    'use client'

    import { useState } from 'react'
    import { useRouter } from 'next/navigation'
    import { Button } from '@/components/ui/button'
    import { logoutUser } from '@/lib/api/auth'
    import { toast } from 'sonner'

    interface LogoutButtonProps {
      className?: string
    }

    export default function LogoutButton({ className }: LogoutButtonProps) {
      const router = useRouter()
      const [isLoading, setIsLoading] = useState(false)

      async function handleLogout() {
        setIsLoading(true)
        const result = await logoutUser()
        if (result.success) {
          router.push('/login')
        } else {
          toast.error('Impossible de se déconnecter. Veuillez réessayer.')
          setIsLoading(false)
        }
      }

      return (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={className}
          onClick={handleLogout}
          disabled={isLoading}
          aria-label="Se déconnecter"
        >
          {isLoading ? 'Déconnexion…' : 'Se déconnecter'}
        </Button>
      )
    }
    ```
  - [x] `variant="ghost"` : discret, conforme au design system (pas un CTA primaire — la déconnexion n'est pas une action à promouvoir)
  - [x] `router.push('/login')` après succès — AC #2 (redirige vers login)
  - [x] `toast.error()` si réseau down — conformément aux conventions CLAUDE.md (erreurs système → toast, pas inline)
  - [x] `aria-label="Se déconnecter"` — accessibilité WCAG 2.1 (NFR-A2)

### Frontend — Point d'entrée UI (Page d'accueil)

- [x] Task 5 : Afficher `LogoutButton` sur la page d'accueil si l'utilisateur est connecté (AC: #1)
  - [x] La page `siana-memento-web/src/app/page.tsx` est actuellement la smoke page (waitlist + formulaire Resend)
  - [x] Ajouter un bloc conditionnel **en haut à droite** de la page qui :
    1. Appelle `getMe()` côté client au montage du composant
    2. Si l'utilisateur est connecté → affiche `<LogoutButton />`
    3. Si non connecté → n'affiche rien (pas de redirection, la smoke page est publique)
  - [x] **Implémentation recommandée** : créer un composant client `UserMenu.tsx` dans `/components/siana/` qui encapsule cet état :
    ```tsx
    'use client'

    import { useEffect, useState } from 'react'
    import { getMe, type User } from '@/lib/api/auth'
    import LogoutButton from '@/components/siana/LogoutButton'

    export default function UserMenu() {
      const [user, setUser] = useState<User | null>(null)

      useEffect(() => {
        getMe().then((result) => {
          if (result.success) setUser(result.user)
        })
      }, [])

      if (!user) return null

      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{user.email}</span>
          <LogoutButton />
        </div>
      )
    }
    ```
  - [x] Intégrer `<UserMenu />` dans `page.tsx` dans le `<header>` existant (aux côtés de `ThemeToggle`)
  - [x] **`page.tsx` est actuellement un Server Component** — `UserMenu` doit être `'use client'` (ce que la spec ci-dessus garantit)
  - [x] L'appel `getMe()` est côté client (pas SSR) — acceptable pour le MVP. Le composant s'affiche de façon asynchrone sans bloquer le rendu de la page

### Review Follow-ups (AI)

- [ ] [AI-Review][MEDIUM] Implémenter un middleware Next.js (`middleware.ts`) pour protéger les routes authentifiées — AC#2 est actuellement satisfait de façon proactive uniquement (`router.push('/login')` après logout) mais pas défensive : un utilisateur qui accède directement à une URL protégée sans passer par le bouton logout ne sera pas redirigé. À implémenter lors de la création des premières routes protégées (Epic 3+).

### Tests

- [x] Task 6 : Tests fonctionnels logout backend (AC: #1, #2, #3)
  - [x] Créer `siana-memento-api/tests/functional/auth/logout.spec.ts` :
    ```typescript
    import { test } from '@japa/runner'
    import testUtils from '@adonisjs/core/services/test_utils'
    import User from '#models/user'

    test.group('POST /auth/logout', (group) => {
      group.each.setup(() => testUtils.db().withGlobalTransaction())

      test('returns 200 and clears session cookie when authenticated', async ({ client, assert }) => {
        const user = await User.create({
          email: 'sophie@example.com',
          password: 'motdepasse123',
          provider: 'email',
        })

        // Créer une session via login
        const loginResponse = await client.post('/auth/login').json({
          email: 'sophie@example.com',
          password: 'motdepasse123',
        })
        loginResponse.assertStatus(200)
        loginResponse.assertCookie('adonis-session')

        // Récupérer le cookie de session
        const setCookieHeader = loginResponse.header('set-cookie') as string[]
        const sessionCookie = setCookieHeader
          .find((c: string) => c.startsWith('adonis-session'))
          ?.split(';')[0] ?? ''

        // Déconnexion
        const logoutResponse = await client
          .post('/auth/logout')
          .header('Cookie', sessionCookie)
        logoutResponse.assertStatus(200)
        const body = logoutResponse.body()
        assert.isTrue(body.success)
      })

      test('returns 200 even when called without active session (idempotent)', async ({ client, assert }) => {
        const response = await client.post('/auth/logout')
        response.assertStatus(200)
        const body = response.body()
        assert.isTrue(body.success)
      })

      test('authenticated request fails after logout', async ({ client }) => {
        await User.create({
          email: 'thomas@example.com',
          password: 'motdepasse123',
          provider: 'email',
        })

        // Login
        const loginResponse = await client.post('/auth/login').json({
          email: 'thomas@example.com',
          password: 'motdepasse123',
        })
        const setCookieHeader = loginResponse.header('set-cookie') as string[]
        const sessionCookie = setCookieHeader
          .find((c: string) => c.startsWith('adonis-session'))
          ?.split(';')[0] ?? ''

        // Logout
        await client.post('/auth/logout').header('Cookie', sessionCookie)

        // Tenter d'accéder à /auth/me avec l'ancien cookie — doit échouer
        const meResponse = await client
          .get('/auth/me')
          .header('Cookie', sessionCookie)
        meResponse.assertStatus(401)
      })
    })
    ```
  - [x] **Pattern identique** aux tests existants (`login.spec.ts`, `google_oauth.spec.ts`) : `testUtils.db().withGlobalTransaction()` pour isolation
  - [x] **Cookie chaining** : extraire `set-cookie` du login pour réutiliser dans logout (même pattern que Story 2.3 debug log)
  - [x] Suite complète reste **verte** : 36 tests existants + 3 nouveaux = **39 tests passent**

## Dev Notes

### Points Critiques — À Ne Pas Manquer

1. **`auth.use('web').logout()` côté AdonisJS** : Cette méthode détruit la session serveur ET renvoie un header `Set-Cookie` qui expire le cookie `adonis-session` côté navigateur. Pas besoin de manipulation manuelle du cookie.

2. **Pas de `middleware.auth()` sur `/auth/logout`** : Intentionnel. Si la session est expirée (ex: 7 jours d'inactivité), le frontend appellera quand même `/auth/logout` pour être cohérent. Sans le middleware, `auth.use('web').logout()` retourne simplement 200 sans erreur — comportement idempotent sécurisé.

3. **`credentials: 'include'` dans le fetch frontend** : Sans ça, le cookie `adonis-session` ne sera pas envoyé avec la requête POST depuis le navigateur, et le serveur ne saura pas quelle session détruire.

4. **`router.push('/login')` après logout** : AC #2 — après déconnexion, toute tentative d'accès à une ressource protégée doit rediriger vers `/login`. En poussant directement sur `/login` après le logout, on garantit cet AC sans dépendre du middleware de protection des routes (qui n'existe pas encore côté Next.js).

5. **`toast.error()` si erreur réseau** : Conformément aux conventions CLAUDE.md (`#Frontend Conventions`). Les erreurs système (réseau, API down) → `toast.error()` via Sonner. Le `<Toaster>` est déjà monté globalement dans `layout.tsx`.

6. **`UserMenu` : appel `getMe()` côté client uniquement** : Ne pas faire de Server Component pour ce composant. Le check d'authentification côté serveur nécessiterait de passer les cookies de la requête au fetch backend — complexité non justifiée pour le MVP. Un composant client avec `useEffect + getMe()` suffit.

7. **`page.tsx` est un Server Component** : `UserMenu` doit être `'use client'` pour utiliser `useEffect` et `useState`. Ne pas contaminer `page.tsx` avec `'use client'` — garder le Server Component et juste importer le `UserMenu` client.

8. **Cookie `adonis-session` et `adonis-session_s`** : AdonisJS génère deux cookies — le cookie de session et sa signature. Dans les tests Japa, il suffit de passer `adonis-session=xxx` (le test `client` gère automatiquement les cookies via cookie jar). Pour le cookie chaining manuel, prendre la valeur complète depuis `set-cookie`.

9. **Route placement dans `routes.ts`** : La route `POST /auth/logout` doit être dans le groupe `.prefix('/auth')` avec les autres routes auth. Le chemin final sera `/auth/logout` — cohérent avec le pattern existant.

10. **`LogoutButton` : `type="button"` obligatoire** : Évite le submit accidentel si le bouton est dans un `<form>` (même pattern que `GoogleButton.tsx` — voir Story 2.3).

### Project Structure Notes

**Backend — Fichiers à modifier :**
```
siana-memento-api/
├── start/
│   └── routes.ts               ← MODIFIER (ajouter POST /logout dans groupe /auth)
└── app/
    └── controllers/
        └── auth_controller.ts  ← MODIFIER (ajouter méthode logout())
```

**Frontend — Fichiers à créer :**
```
siana-memento-web/src/
└── components/
    └── siana/
        ├── LogoutButton.tsx    ← CRÉER
        └── UserMenu.tsx        ← CRÉER
```

**Frontend — Fichiers à modifier :**
```
siana-memento-web/src/
├── app/
│   └── page.tsx                ← MODIFIER (intégrer <UserMenu /> en haut à droite)
└── lib/
    └── api/
        └── auth.ts             ← MODIFIER (ajouter logoutUser())
```

**Tests à créer :**
```
siana-memento-api/
└── tests/functional/auth/
    └── logout.spec.ts          ← CRÉER (3 tests)
```

### Conventions de Code (depuis codebase existante)

**Pattern controller AdonisJS (depuis auth_controller.ts) :**
```typescript
async logout({ auth, response }: HttpContext) {
  await auth.use('web').logout()
  return response.ok({ success: true })
}
```

**Pattern réponse standardisée (depuis auth_controller.ts existant) :**
```typescript
// Succès — toujours ce format
return response.ok({ success: true })

// Erreur (si nécessaire)
return response.unauthorized({ success: false, error: { code: 'CODE', message: '...' } })
```

**Pattern test fonctionnel avec cookie chaining (depuis google_oauth.spec.ts, debug log) :**
```typescript
// Extraire cookie depuis header set-cookie
const setCookieHeader = loginResponse.header('set-cookie') as string[]
const sessionCookie = setCookieHeader
  .find((c: string) => c.startsWith('adonis-session'))
  ?.split(';')[0] ?? ''

// Utiliser dans la requête suivante
const response = await client.get('/auth/me').header('Cookie', sessionCookie)
```

**Pattern composant client Next.js (depuis LoginForm.tsx, RegisterForm.tsx) :**
```tsx
'use client'
// useState pour état local
// useRouter pour navigation programmatique
// fetch via lib/api/auth.ts (jamais fetch direct dans composant)
```

**Pattern `fetch` avec credentials (depuis auth.ts existant) :**
```typescript
const res = await fetch(`${API_URL}/auth/logout`, {
  method: 'POST',
  credentials: 'include',  // cookie adonis-session envoyé
})
```

### API Endpoint

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| POST | `/auth/logout` | — (aucun) | Détruit la session serveur, invalide le cookie |

**POST /auth/logout — Response 200 OK :**
```json
{ "success": true }
```

### Intelligence Stories Précédentes — À Réutiliser

**Depuis Story 2.2 (login) :**
- `auth.use('web').login(user)` → logout utilise le même guard `'web'` : `auth.use('web').logout()`
- Pattern `response.ok()` pour succès

**Depuis Story 2.3 (OAuth) :**
- Debug log : "Cookie chaining pour `/auth/me` authentifié" — même technique pour les tests logout
- Debug log : "/auth/me 401 body format" — `assertStatus(401)` sans assertion sur le body pour les 401 AdonisJS natifs

**Depuis Story 2.1 (register) :**
- Pattern `User.create({ email, password, provider: 'email' })` dans les tests pour créer un utilisateur de test

### Analyse Git (5 derniers commits)

```
bf7ef27 feat(S2-3): connexion et inscription via Google OAuth (#40)
8decbb8 feat(S2-2): connexion par email et mot de passe (#39)
539c99f fix: run migrations before server start on Railway
350ecbd feat(S2-1): inscription par email et mot de passe (#38)
6486f57 feat(S1-4): smoke page statique avec formulaire waitlist Resend (#37)
```

- Patterns d'implémentation stables depuis 3 stories (2.1, 2.2, 2.3) — réutiliser à l'identique
- `fix: run migrations before server start on Railway` → pas d'impact sur cette story (pas de migration)
- Commit format : `feat(S2-4): déconnexion` — préfixe `feat`, scope `S2-4`

### Session Management (Architecture §2.2)

```typescript
// Config session AdonisJS (depuis architecture.md §2.2)
{
  driver: 'cookie',
  age: '7 days',
  cookie: {
    httpOnly: true,    // XSS protection — ne pas lire via JS
    secure: true,      // HTTPS only
    sameSite: 'lax'    // CSRF protection partielle
  }
}
```

`auth.use('web').logout()` :
1. Supprime l'entrée de session en mémoire (côté serveur, selon le driver cookie)
2. Envoie `Set-Cookie: adonis-session=; Max-Age=0; ...` dans la réponse HTTP
3. Le navigateur supprime le cookie automatiquement
4. La signature `adonis-session_s` est également invalidée

### Accessibilité (NFR-A1 à A7)

- `LogoutButton` : `aria-label="Se déconnecter"` si le bouton n'a pas de texte visible permanent
- `disabled={isLoading}` : empêche les double-clics, annoncé via `aria-disabled` par Radix UI (shadcn `Button`)
- Le texte change de "Se déconnecter" → "Déconnexion…" pendant le chargement — état communiqué visuellement ET via le DOM (texte accessible)
- Touch target ≥ 44px : `size="sm"` de shadcn garantit ≥ 36px de hauteur — si insuffisant, ajouter `className="min-h-[44px]"` (NFR-A2)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — User story + acceptance criteria originaux
- [Source: _bmad-output/planning-artifacts/architecture.md#2.2 Session Management] — Cookie driver, httpOnly, 7 jours, `auth.use('web')`
- [Source: _bmad-output/planning-artifacts/architecture.md#2.3 Rate Limiting] — Pas de rate limit sur logout
- [Source: _bmad-output/planning-artifacts/architecture.md#3.1 Response Format] — Format `{ success: true }` / `{ success: false, error: {...} }`
- [Source: _bmad-output/implementation-artifacts/2-3-connexion-et-inscription-via-google-oauth.md#Debug Log] — Cookie chaining dans tests Japa, gestion 401 body
- [Source: _bmad-output/implementation-artifacts/2-2-connexion-par-email-et-mot-de-passe.md] — Pattern `auth.use('web').login(user)`, tests patterns
- [Source: siana-memento-api/app/controllers/auth_controller.ts] — Pattern @inject(), format réponse, `auth.use('web')`
- [Source: siana-memento-api/start/routes.ts] — Groupe `/auth`, patterns middleware
- [Source: siana-memento-web/src/lib/api/auth.ts] — Pattern fetch, `credentials: 'include'`, types Result
- [Source: siana-memento-web/src/app/layout.tsx] — `<Toaster>` monté globalement (sonner)
- [Source: siana-memento-web/src/components/siana/GoogleButton.tsx] — Pattern composant client, `type="button"`
- [Source: CLAUDE.md#Frontend Conventions] — Toasts pour erreurs système, `toast.error()` via sonner

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Aucun blocage rencontré. Tests RED confirmés (2/3 failing avant implémentation route), puis 3/3 GREEN après Tasks 1-2.

### Completion Notes List

- ✅ AC#1 : `POST /auth/logout` implémenté, session invalidée serveur + cookie effacé via `auth.use('web').logout()`
- ✅ AC#2 : `LogoutButton` redirige vers `/login` après succès — testable via le composant React
- ✅ AC#3 : comportement idempotent confirmé par test dédié (retourne 200 sans session active)
- ✅ 39/39 tests passent (36 préexistants + 3 nouveaux dans `logout.spec.ts`)
- ✅ TypeScript strict : `npx tsc --noEmit` sans erreur sur le frontend
- ✅ ESLint propre sur les fichiers modifiés/créés
- Note : erreurs ESLint préexistantes dans `ThemeToggle.tsx` et `design-system/page.tsx` non introduites par cette story
- `UserMenu` intégré dans le `<header>` existant de `page.tsx` (aux côtés de `ThemeToggle`) — solution plus propre que `absolute top-4 right-4` car le header existait déjà

### File List

**Backend — Modifiés :**
- `siana-memento-api/app/controllers/auth_controller.ts` — ajout méthode `logout()`
- `siana-memento-api/start/routes.ts` — ajout route `POST /auth/logout`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — statut `2-4-deconnexion` → `review`

**Backend — Créés :**
- `siana-memento-api/tests/functional/auth/logout.spec.ts` — 3 tests fonctionnels

**Frontend — Créés :**
- `siana-memento-web/src/components/siana/LogoutButton.tsx` — composant bouton déconnexion
- `siana-memento-web/src/components/siana/UserMenu.tsx` — menu utilisateur conditionnel

**Frontend — Modifiés :**
- `siana-memento-web/src/lib/api/auth.ts` — ajout fonction `logoutUser()`
- `siana-memento-web/src/app/page.tsx` — intégration `<UserMenu />` dans le header

### Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | claude-sonnet-4-6 | Implémentation complète : `logout()` controller, route POST /auth/logout, `logoutUser()` API, `LogoutButton`, `UserMenu`, intégration page.tsx, 3 tests (39/39 pass) |
| 2026-02-22 | claude-sonnet-4-6 | Code review : fix M1 (`assertStatus(200)` manquant test 3), fix M3 (loading state `UserMenu` pour éviter CLS), task de suivi M2 (middleware Next.js route protection) |
