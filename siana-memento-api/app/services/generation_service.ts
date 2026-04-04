import { GoogleGenAI } from '@google/genai'

export interface TemplateConfig {
  id: string
  name: string
  identity: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  illustration: string
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
// La liste de 5 templates change rarement, le couplage cross-package serait inutilement complexe.
const TEMPLATES: TemplateConfig[] = [
  {
    id: 'boheme',
    name: 'Bohème',
    identity: 'Romantique & naturel',
    primaryColor: '#C17A6F',
    secondaryColor: '#F5E6D3',
    accentColor: '#2D4A3E',
    illustration: 'Aquarelle douce',
  },
  {
    id: 'moderne',
    name: 'Moderne',
    identity: 'Épuré & sophistiqué',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    accentColor: '#D4AF37',
    illustration: 'Flat design géométrique',
  },
  {
    id: 'classique',
    name: 'Classique',
    identity: 'Intemporel & élégant',
    primaryColor: '#800020',
    secondaryColor: '#F4EAD5',
    accentColor: '#D4AF37',
    illustration: 'Portrait dessiné',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    identity: 'Nostalgie & rétro chic',
    primaryColor: '#A67C52',
    secondaryColor: '#EFE8D8',
    accentColor: '#6B705C',
    illustration: 'Rotoscope années 70',
  },
  {
    id: 'minimaliste',
    name: 'Minimaliste',
    identity: 'Épuré & zen',
    primaryColor: '#E8DCD4',
    secondaryColor: '#FAF8F6',
    accentColor: '#A8968A',
    illustration: 'Line art one-line',
  },
]

export function getTemplate(id: string): TemplateConfig {
  const tpl = TEMPLATES.find((t) => t.id === id)
  if (!tpl) throw new Error(`Template inconnu : ${id}`)
  return tpl
}

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

function buildPrompt(
  theme: TemplateConfig,
  weddingData: WeddingData,
  iterationNumber: number,
  feedback?: string
): string {
  const pose = pickRandom(POSE_VARIATIONS)
  // Identifiant unique injecté dans le prompt pour forcer Gemini à produire un résultat différent
  const variationSeed = `[variation-id: ${Date.now()}-${Math.random().toString(36).slice(2, 8)}]`

  const basePrompt = `Create a beautiful illustrated wedding 'Save The Date' poster.
${variationSeed}

Subject: A romantic couple (based exactly on the provided reference photos). They are ${pose}.
Setting: ${weddingData.weddingLocation}.

Artistic Direction:
- Theme: ${theme.name}
- Medium/Style: ${theme.illustration}
- Vibe/Mood: ${theme.identity}
- Color palette: Dominant ${theme.primaryColor}, Secondary ${theme.secondaryColor}, Accents of ${theme.accentColor}.
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
- Use colors from the palette for the text (primarily ${theme.primaryColor} or ${theme.accentColor} on lighter areas).`

  if (iterationNumber > 1 && feedback) {
    return `${basePrompt}

ITERATION FEEDBACK — This is iteration #${iterationNumber}. The user was not satisfied with the previous version. Please create a SIGNIFICANTLY DIFFERENT composition while keeping the same theme and information. Specific feedback to address:
- ${feedback}
- Produce a noticeably different composition, angle, and arrangement from the previous attempt.`
  }

  return basePrompt
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generateDesignImage(
  photos: PhotoInput[],
  theme: TemplateConfig,
  weddingData: WeddingData,
  iterationNumber: number,
  feedback?: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const parts: any[] = photos.map((photo) => ({
    inlineData: {
      data: photo.base64,
      mimeType: photo.mimeType,
    },
  }))

  parts.push({ text: buildPrompt(theme, weddingData, iterationNumber, feedback) })

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
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`
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

  throw lastError
}
