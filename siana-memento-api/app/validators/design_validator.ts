import vine from '@vinejs/vine'

const photoSchema = vine.object({
  publicId: vine.string().minLength(1).maxLength(255),
  url: vine.string().url().maxLength(500),
})

export const createDesignValidator = vine.compile(
  vine.object({
    photos: vine.array(photoSchema).minLength(1).maxLength(2),
  })
)
