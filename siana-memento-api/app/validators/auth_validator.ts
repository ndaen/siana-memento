import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .trim()
      .email()
      .normalizeEmail(),
    password: vine.string().minLength(8),
    fullName: vine.string().trim().optional(),
  })
)
