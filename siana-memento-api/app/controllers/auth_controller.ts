import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { registerValidator } from '#validators/auth_validator'
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
}
