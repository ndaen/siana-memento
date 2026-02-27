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

function buildPrompt(theme: TemplateConfig, weddingData: WeddingData): string {
  return `Create a beautiful background illustration for a wedding 'Save The Date' invitation. 

Subject: A romantic couple (based exactly on the provided reference photos). They are [insérer une variable de pose, ex: holding hands and looking at each other / walking away into the distance].
Setting: ${weddingData.weddingLocation} // Ex: "A lush botanical garden with fairy lights"

Artistic Direction:
- Theme: ${theme.name}
- Medium/Style: ${theme.illustration}
- Vibe/Mood: ${theme.identity}
- Color palette: Dominant ${theme.primaryColor}, Secondary ${theme.secondaryColor}, Accents of ${theme.accentColor}.
- Lighting: Soft, cinematic, romantic lighting.

Composition & Layout:
- Portrait orientation.
- The couple should be framed in the center.
- VERY IMPORTANT: Do NOT include any letters, words, numbers, or text whatsoever. 
- Leave clear, solid, elegant empty space (negative space) at the extreme top and bottom of the image for typography to be added later. Keep the background in these areas simple and uncluttered.`
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generateDesignImage(
  photos: PhotoInput[],
  theme: TemplateConfig,
  weddingData: WeddingData
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const parts: any[] = photos.map((photo) => ({
    inlineData: {
      data: photo.base64,
      mimeType: photo.mimeType,
    },
  }))

  parts.push({ text: buildPrompt(theme, weddingData) })

  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: { parts },
        config: {
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
