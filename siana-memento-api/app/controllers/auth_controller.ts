import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import env from '#start/env'
import { registerValidator, loginValidator } from '#validators/auth_validator'
import AuthService from '#services/auth_service'

@inject()
export default class AuthController {
  constructor(protected authService: AuthService) {}

  async register({ request, auth, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const existing = await this.authService.findByEmail(data.email)
    if (existing) {
      return response.unprocessableEntity({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'Un compte existe déjà avec cet email',
        },
      })
    }

    const user = await this.authService.register({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
    })

    await auth.use('web').login(user)

    return response.created({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      },
    })
  }

  async login({ request, auth, response }: HttpContext) {
    const data = await request.validateUsing(loginValidator)

    try {
      const user = await this.authService.login(data.email, data.password)
      await auth.use('web').login(user)

      return response.ok({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
          },
        },
      })
    } catch {
      return response.unauthorized({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email ou mot de passe incorrect',
        },
      })
    }
  }

  async redirectToGoogle({ ally, request, session }: HttpContext) {
    const returnTo = request.input('returnTo', '/')
    // Sécurité : returnTo doit être un chemin relatif pour éviter les open redirects
    const safeReturnTo = typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/'
    session.put('oauth_return_to', safeReturnTo)
    return ally.use('google').redirect()
  }

  async googleCallback({ ally, auth, response, session }: HttpContext) {
    const google = ally.use('google')

    if (google.accessDenied()) {
      return response.redirect(`${env.get('FRONTEND_URL')}/login?oauth=denied`)
    }
    if (google.stateMisMatch()) {
      return response.redirect(`${env.get('FRONTEND_URL')}/login?oauth=state_mismatch`)
    }
    if (google.hasError()) {
      return response.redirect(`${env.get('FRONTEND_URL')}/login?oauth=error`)
    }

    let googleUser: Awaited<ReturnType<typeof google.user>>
    try {
      googleUser = await google.user()
      // NFR-S7 : token OAuth utilisé côté serveur uniquement, jamais exposé au client
    } catch {
      return response.redirect(`${env.get('FRONTEND_URL')}/login?oauth=error`)
    }

    if (!googleUser.email) {
      return response.redirect(`${env.get('FRONTEND_URL')}/login?oauth=no_email`)
    }

    const user = await this.authService.findOrCreateOAuthUser({
      email: googleUser.email,
      fullName: googleUser.name ?? null,
      providerId: googleUser.id,
    })

    await auth.use('web').login(user)

    // Lire et supprimer returnTo en une opération (idempotent)
    const returnTo = session.pull('oauth_return_to', '/')
    return response.redirect(`${env.get('FRONTEND_URL')}${returnTo}`)
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.user!
    return response.ok({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      },
    })
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.ok({ success: true })
  }
}
