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

const GEMINI_MODEL = 'gemini-2.5-flash-image'
const MAX_ATTEMPTS = 3
const BACKOFF_BASE_MS = 2000

function buildPrompt(theme: TemplateConfig): string {
  return `Create a beautiful background illustration for a 'Save The Date' wedding invitation featuring the couple in the provided photos.
Theme: ${theme.name}
Style: ${theme.illustration}
Vibe: ${theme.identity}
Color palette: Primary ${theme.primaryColor}, Secondary ${theme.secondaryColor}, Accent ${theme.accentColor}.
IMPORTANT: Do NOT include any text in the image. Leave clear, elegant empty space (negative space) at the top and bottom of the image for text to be added later.`
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generateDesignImage(
  photos: PhotoInput[],
  theme: TemplateConfig
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const parts: any[] = photos.map((photo) => ({
    inlineData: {
      data: photo.base64,
      mimeType: photo.mimeType,
    },
  }))

  parts.push({ text: buildPrompt(theme) })

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
