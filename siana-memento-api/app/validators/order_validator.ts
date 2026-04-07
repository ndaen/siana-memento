import vine from '@vinejs/vine'

export const createOrderValidator = vine.compile(
  vine.object({
    designId: vine.number(),
    sessionToken: vine
      .string()
      .fixedLength(64)
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
  })
)
