import User from '#models/user'

export default class AuthService {
  async register(data: { email: string; password: string; fullName?: string }) {
    const user = await User.create({
      email: data.email,
      password: data.password,
      fullName: data.fullName ?? null,
      provider: 'email',
    })
    return user
  }

  async findByEmail(email: string) {
    return User.findBy('email', email)
  }

  async login(email: string, password: string) {
    return User.verifyCredentials(email, password)
  }
}
