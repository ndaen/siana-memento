import vine from '@vinejs/vine'

export const createOrderValidator = vine.compile(
  vine.object({
    designId: vine.number(),
  })
)
