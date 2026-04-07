import User from '#models/user'

const DEFAULT_PASSWORD = 'motdepasse123'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loginAs(
  client: any,
  overrides?: { email?: string; password?: string }
): Promise<{ cookie: string; user: InstanceType<typeof User> }> {
  const email = overrides?.email ?? `test-${Date.now()}@example.com`
  const password = overrides?.password ?? DEFAULT_PASSWORD
  const user = await User.create({
    email,
    password,
    provider: 'email',
  })
  const loginResponse = await client
    .post('/auth/login')
    .json({ email, password })
  const rawCookies = loginResponse.headers()['set-cookie'] as unknown as string[] | undefined
  const cookie = rawCookies?.map((c: string) => c.split(';')[0]).join('; ') ?? ''
  return { cookie, user }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function extractCookie(loginResponse: any): Promise<string> {
  const rawCookies = loginResponse.headers()['set-cookie'] as unknown as string[] | undefined
  return rawCookies?.map((c: string) => c.split(';')[0]).join('; ') ?? ''
}
