import { GoogleGenAI } from '@google/genai'

export interface PaletteConfig {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

export interface TemplateConfig {
  id: string
  name: string
  identity: string
  illustration: string
  palettes: PaletteConfig[]
}

export interface PhotoInput {
  base64: string
  mimeType: string
}

export interface WeddingData {
  partner1Name: string
  partner2Name: string
  weddingDate: string // Format lisible ex: "20 septembre 2026"
  weddingLocation: string
}

// Duplicate intentionnel — le backend et le frontend sont deux packages séparés.
// La liste de 5 templates × 3 palettes change rarement, le couplage cross-package serait inutilement complexe.
const TEMPLATES: TemplateConfig[] = [
  {
    id: 'boheme',
    name: 'Bohème',
    identity: 'Romantique & naturel',
    illustration: 'Aquarelle douce',
    palettes: [
      {
        id: 'terre-sauge',
        name: 'Terre & Sauge',
        primaryColor: '#C17A6F',
        secondaryColor: '#F5E6D3',
        accentColor: '#2D4A3E',
      },
      {
        id: 'lavande-miel',
        name: 'Lavande & Miel',
        primaryColor: '#7B6B8A',
        secondaryColor: '#FDF6EC',
        accentColor: '#8B6F47',
      },
      {
        id: 'rose-foret',
        name: 'Rose & Forêt',
        primaryColor: '#9E5A63',
        secondaryColor: '#F0EBE3',
        accentColor: '#3D5A45',
      },
    ],
  },
  {
    id: 'moderne',
    name: 'Moderne',
    identity: 'Épuré & sophistiqué',
    illustration: 'Flat design géométrique',
    palettes: [
      {
        id: 'noir-or',
        name: 'Noir & Or',
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        accentColor: '#D4AF37',
      },
      {
        id: 'marine-cuivre',
        name: 'Marine & Cuivre',
        primaryColor: '#1B2A4A',
        secondaryColor: '#F7F5F2',
        accentColor: '#B87333',
      },
      {
        id: 'charbon-blush',
        name: 'Charbon & Blush',
        primaryColor: '#2C2C2C',
        secondaryColor: '#FFFFFF',
        accentColor: '#C27685',
      },
    ],
  },
  {
    id: 'classique',
    name: 'Classique',
    identity: 'Intemporel & élégant',
    illustration: 'Portrait dessiné',
    palettes: [
      {
        id: 'bordeaux-or',
        name: 'Bordeaux & Or',
        primaryColor: '#800020',
        secondaryColor: '#F4EAD5',
        accentColor: '#D4AF37',
      },
      {
        id: 'bleu-royal',
        name: 'Bleu Royal',
        primaryColor: '#1E3A5F',
        secondaryColor: '#F2EDE6',
        accentColor: '#C5A258',
      },
      {
        id: 'emeraude-creme',
        name: 'Émeraude & Crème',
        primaryColor: '#2E5945',
        secondaryColor: '#FBF7F0',
        accentColor: '#B8860B',
      },
    ],
  },
  {
    id: 'vintage',
    name: 'Vintage',
    identity: 'Nostalgie & rétro chic',
    illustration: 'Rotoscope années 70',
    palettes: [
      {
        id: 'ocre-olive',
        name: 'Ocre & Olive',
        primaryColor: '#A67C52',
        secondaryColor: '#EFE8D8',
        accentColor: '#6B705C',
      },
      {
        id: 'rouille-moutarde',
        name: 'Rouille & Moutarde',
        primaryColor: '#8B4513',
        secondaryColor: '#F5EDDA',
        accentColor: '#B8860B',
      },
      {
        id: 'brique-sapin',
        name: 'Brique & Sapin',
        primaryColor: '#9B5B4C',
        secondaryColor: '#F0E9DD',
        accentColor: '#4A5D4F',
      },
    ],
  },
  {
    id: 'minimaliste',
    name: 'Minimaliste',
    identity: 'Épuré & zen',
    illustration: 'Line art one-line',
    palettes: [
      {
        id: 'nude-taupe',
        name: 'Nude & Taupe',
        primaryColor: '#E8DCD4',
        secondaryColor: '#FAF8F6',
        accentColor: '#A8968A',
      },
      {
        id: 'argile-sable',
        name: 'Argile & Sable',
        primaryColor: '#B07156',
        secondaryColor: '#FAF5F0',
        accentColor: '#8C6E5D',
      },
      {
        id: 'saumon-lin',
        name: 'Saumon & Lin',
        primaryColor: '#D4917A',
        secondaryColor: '#FFF8F5',
        accentColor: '#C07A60',
      },
    ],
  },
]

export function getTemplate(id: string): TemplateConfig {
  const tpl = TEMPLATES.find((t) => t.id === id)
  if (!tpl) throw new Error(`Template inconnu : ${id}`)
  return tpl
}

export function getPalette(templateId: string, paletteId: string | null): PaletteConfig {
  const template = getTemplate(templateId)
  if (paletteId) {
    const found = template.palettes.find((p) => p.id === paletteId)
    if (found) return found
  }
  return template.palettes[0]
}

// Map exportée pour la validation cross-template dans le validateur VineJS
export const VALID_PALETTE_IDS: Record<string, string[]> = TEMPLATES.reduce(
  (acc, tpl) => {
    acc[tpl.id] = tpl.palettes.map((p) => p.id)
    return acc
  },
  {} as Record<string, string[]>
)

const GEMINI_MODEL = 'gemini-2.5-flash-image'
const MAX_ATTEMPTS = 3
const BACKOFF_BASE_MS = 2000

const POSE_VARIATIONS = [
  'holding hands and looking lovingly at each other',
  'walking away together into the distance, seen from behind',
  'standing forehead to forehead, eyes closed',
  'laughing together in a candid, joyful moment',
  'sitting side by side, leaning into each other',
  'dancing together in an intimate embrace',
  'one partner gently holding the other from behind',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildInitialPrompt(
  theme: TemplateConfig,
  palette: PaletteConfig,
  weddingData: WeddingData
): string {
  const pose = pickRandom(POSE_VARIATIONS)
  const variationSeed = `[variation-id: ${Date.now()}-${Math.random().toString(36).slice(2, 8)}]`

  return `Create a beautiful illustrated wedding 'Save The Date' poster.
${variationSeed}

Subject: A romantic couple (based exactly on the provided reference photos). They are ${pose}.
Setting: ${weddingData.weddingLocation}.

Artistic Direction:
- Theme: ${theme.name}
- Medium/Style: ${theme.illustration}
- Vibe/Mood: ${theme.identity}
- Color palette "${palette.name}": Dominant ${palette.primaryColor}, Secondary ${palette.secondaryColor}, Accents of ${palette.accentColor}.
- Lighting: Soft, cinematic, romantic lighting.

Composition & Layout:
- Portrait orientation (3:4 ratio).
- The couple should be the central focus of the illustration.

Typography — IMPORTANT, include ALL of the following text elegantly on the poster:
- The names "${weddingData.partner1Name} & ${weddingData.partner2Name}" displayed prominently in an elegant, decorative font style that matches the ${theme.name} theme.
- The date "${weddingData.weddingDate}" displayed clearly.
- The location "${weddingData.weddingLocation}" displayed clearly.
- The words "Save The Date" as a header or subtitle.
- Text must be legible, well-spaced, and integrated into the overall composition.
- Use colors from the palette for the text (primarily ${palette.primaryColor} or ${palette.accentColor} on lighter areas).`
}

function buildIterationPrompt(
  theme: TemplateConfig,
  palette: PaletteConfig,
  weddingData: WeddingData,
  feedback: string
): string {
  return `You are refining an existing wedding 'Save The Date' poster based on the client's feedback.

CURRENT POSTER: The first image provided is the current version of the poster that needs to be modified.
REFERENCE PHOTOS: The remaining images are reference photos of the couple — use them to keep facial features and physical appearance accurate.

CLIENT FEEDBACK:
- ${feedback}

INSTRUCTIONS:
1. Start from the current poster as your base. Do NOT create a completely new design from scratch.
2. Apply the client's feedback precisely — modify only what they asked to change.
3. Preserve everything the client did NOT mention: keep the same overall composition, layout, pose, background, and artistic style unless the feedback explicitly asks to change them.
4. Keep all text identical and legible: "${weddingData.partner1Name} & ${weddingData.partner2Name}", "${weddingData.weddingDate}", "${weddingData.weddingLocation}", "Save The Date".
5. Maintain the ${theme.name} theme (${theme.illustration} style, palette "${palette.name}": ${palette.primaryColor}, ${palette.secondaryColor}, ${palette.accentColor}).
6. Output a portrait illustration (3:4 ratio).`
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Résultat d'une tentative de génération, avec les métadonnées à persister/logguer
 * (Story 6.4). Ne lève PAS d'exception sur échec Gemini : l'appelant décide quoi faire
 * et dispose d'`attempts`/`durationMs`/`error` pour la ligne `Generation` + le log Pino.
 */
export interface GenerationOutcome {
  success: boolean
  imageDataUrl?: string
  error?: string
  attempts: number
  durationMs: number
  promptUsed: string
  geminiModel: string
}

export async function generateDesignImage(
  photos: PhotoInput[],
  theme: TemplateConfig,
  palette: PaletteConfig,
  weddingData: WeddingData,
  iterationNumber: number,
  feedback?: string,
  previousImage?: PhotoInput
): Promise<GenerationOutcome> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const isIteration = iterationNumber > 1 && feedback !== undefined && previousImage !== undefined
  const promptUsed = isIteration
    ? buildIterationPrompt(theme, palette, weddingData, feedback as string)
    : buildInitialPrompt(theme, palette, weddingData)

  const parts: any[] = []
  if (isIteration && previousImage) {
    // Itération : image précédente d'abord, puis photos de référence, puis prompt de modification
    parts.push({ inlineData: { data: previousImage.base64, mimeType: previousImage.mimeType } })
  }
  for (const photo of photos) {
    parts.push({ inlineData: { data: photo.base64, mimeType: photo.mimeType } })
  }
  parts.push({ text: promptUsed })

  const startedAt = Date.now()
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: { parts },
        config: {
          temperature: iterationNumber > 1 ? 1.5 : 1.0,
          imageConfig: {
            aspectRatio: '3:4',
          },
        },
      })

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        // Vérifier `.data` : sans elle, l'interpolation produirait `base64,undefined`
        // → image corrompue uploadée vers Cloudinary comme un faux succès.
        if (part.inlineData?.data) {
          return {
            success: true,
            imageDataUrl: `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`,
            attempts: attempt,
            durationMs: Date.now() - startedAt,
            promptUsed,
            geminiModel: GEMINI_MODEL,
          }
        }
      }

      throw new Error('Aucune image retournée par Gemini')
    } catch (error) {
      lastError = error

      if (attempt < MAX_ATTEMPTS) {
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1) // 2s → 4s → 8s
        await sleep(delay)
      }
    }
  }

  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    attempts: MAX_ATTEMPTS,
    durationMs: Date.now() - startedAt,
    promptUsed,
    geminiModel: GEMINI_MODEL,
  }
}
