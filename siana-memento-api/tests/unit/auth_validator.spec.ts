import { test } from '@japa/runner'
import vine from '@vinejs/vine'
import { registerValidator } from '#validators/auth_validator'

test.group('registerValidator', () => {
  test('accepts valid email and password', async ({ assert }) => {
    const output = await registerValidator.validate({
      email: 'test@example.com',
      password: 'motdepasse123',
    })
    assert.equal(output.email, 'test@example.com')
    assert.equal(output.password, 'motdepasse123')
  })

  test('accepts optional fullName', async ({ assert }) => {
    const output = await registerValidator.validate({
      email: 'test@example.com',
      password: 'motdepasse123',
      fullName: 'Sophie Thomas',
    })
    assert.equal(output.fullName, 'Sophie Thomas')
  })

  test('trims email and fullName whitespace', async ({ assert }) => {
    const output = await registerValidator.validate({
      email: '  test@example.com  ',
      password: 'motdepasse123',
      fullName: '  Marie  ',
    })
    assert.equal(output.email, 'test@example.com')
    assert.equal(output.fullName, 'Marie')
  })

  test('rejects invalid email format', async ({ assert }) => {
    await assert.rejects(
      () => registerValidator.validate({ email: 'not-an-email', password: 'motdepasse123' }),
      vine.SimpleMessagesProvider
    )
  })

  test('rejects password shorter than 8 characters', async ({ assert }) => {
    await assert.rejects(
      () => registerValidator.validate({ email: 'test@example.com', password: 'court' }),
      vine.SimpleMessagesProvider
    )
  })

  test('rejects missing email', async ({ assert }) => {
    await assert.rejects(
      () => registerValidator.validate({ password: 'motdepasse123' } as any),
      vine.SimpleMessagesProvider
    )
  })

  test('rejects missing password', async ({ assert }) => {
    await assert.rejects(
      () => registerValidator.validate({ email: 'test@example.com' } as any),
      vine.SimpleMessagesProvider
    )
  })
})
