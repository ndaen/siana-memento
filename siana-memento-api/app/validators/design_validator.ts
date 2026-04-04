import vine from '@vinejs/vine'

// Règle custom : vérifie que la date ISO YYYY-MM-DD est réellement valide
// (ex: 2026-13-40 passe la regex mais n'est pas une vraie date)
const validDateRule = vine.createRule((value: unknown, _options, field) => {
  if (typeof value !== 'string') return
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    field.report('La date est invalide', 'invalid_date', field)
  }
})

const photoSchema = vine.object({
  publicId: vine.string().minLength(1).maxLength(255),
  url: vine.string().url().maxLength(500),
})

export const createDesignValidator = vine.compile(
  vine.object({
    photos: vine.array(photoSchema).minLength(1).maxLength(2),
  })
)

export const updateDesignTemplateValidator = vine.compile(
  vine.object({
    template: vine.enum(['boheme', 'moderne', 'classique', 'vintage', 'minimaliste'] as const),
    sessionToken: vine.string().minLength(64).maxLength(64).optional(),
  })
)

export const updateDesignConfigureValidator = vine.compile(
  vine.object({
    partner1Name: vine.string().trim().minLength(1).maxLength(100),
    partner2Name: vine.string().trim().minLength(1).maxLength(100),
    weddingDate: vine
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .use(validDateRule()),
    weddingLocation: vine.string().trim().minLength(1).maxLength(255),
    sessionToken: vine.string().minLength(64).maxLength(64).optional(),
  })
)

export const triggerGenerationValidator = vine.compile(
  vine.object({
    sessionToken: vine.string().minLength(64).maxLength(64).optional(),
    feedback: vine.string().trim().maxLength(1000).optional(),
  })
)
