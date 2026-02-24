'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UploadedPhoto {
  publicId: string
  url: string
  previewUrl: string // URL.createObjectURL — affichage local uniquement, non persisté
  file: File | null // Référence locale — non persistée (non sérialisable)
}

export type GenerationStep = 'upload' | 'template' | 'configure' | 'generating' | 'result'

interface GenerationStore {
  designId: number | null
  sessionToken: string | null
  photos: UploadedPhoto[]
  currentStep: GenerationStep

  setDesign: (id: number, token: string) => void
  setPhotos: (photos: UploadedPhoto[]) => void
  setStep: (step: GenerationStep) => void
  reset: () => void
}

export const useGenerationStore = create<GenerationStore>()(
  persist(
    (set) => ({
      designId: null,
      sessionToken: null,
      photos: [],
      currentStep: 'upload',

      setDesign: (id, token) => set({ designId: id, sessionToken: token }),
      setPhotos: (photos) => set({ photos }),
      setStep: (step) => set({ currentStep: step }),
      reset: () =>
        set({ designId: null, sessionToken: null, photos: [], currentStep: 'upload' }),
    }),
    {
      name: 'siana-generation-store',
      // previewUrl (objectURL) et file (File non sérialisable) non persistés — comportement attendu
      partialize: (state) => ({
        designId: state.designId,
        sessionToken: state.sessionToken,
        photos: state.photos.map((p) => ({ ...p, previewUrl: '', file: null })),
        currentStep: state.currentStep,
      }),
    }
  )
)
