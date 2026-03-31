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

interface GenerationState {
  designId: number | null
  sessionToken: string | null
  photos: UploadedPhoto[]
  currentStep: GenerationStep
  selectedTemplate: string | null
  partner1Name: string | null
  partner2Name: string | null
  weddingDate: string | null // Format ISO YYYY-MM-DD — sérialisable
  weddingLocation: string | null
  iterationsUsed: number
  generatedImageUrl: string | null
  _hasHydrated: boolean
}

const initialState: GenerationState = {
  designId: null,
  sessionToken: null,
  photos: [],
  currentStep: 'upload',
  selectedTemplate: null,
  partner1Name: null,
  partner2Name: null,
  weddingDate: null,
  weddingLocation: null,
  iterationsUsed: 0,
  generatedImageUrl: null,
  _hasHydrated: false,
}

interface GenerationStore extends GenerationState {
  setDesign: (id: number, token: string) => void
  setPhotos: (photos: UploadedPhoto[]) => void
  setStep: (step: GenerationStep) => void
  setTemplate: (template: string) => void
  setWeddingData: (data: {
    partner1Name: string
    partner2Name: string
    weddingDate: string
    weddingLocation: string
  }) => void
  setGenerationResult: (iterationsUsed: number, imageUrl: string) => void
  setHasHydrated: (val: boolean) => void
  resetForPhotoChange: () => void
  reset: () => void
}

export const useGenerationStore = create<GenerationStore>()(
  persist(
    (set) => ({
      ...initialState,

      setDesign: (id, token) => set({ designId: id, sessionToken: token }),
      setPhotos: (photos) => set({ photos }),
      setStep: (step) => set({ currentStep: step }),
      setTemplate: (template) => set({ selectedTemplate: template }),
      setWeddingData: (data) =>
        set({
          partner1Name: data.partner1Name,
          partner2Name: data.partner2Name,
          weddingDate: data.weddingDate,
          weddingLocation: data.weddingLocation,
        }),
      setGenerationResult: (iterationsUsed, imageUrl) =>
        set({ iterationsUsed, generatedImageUrl: imageUrl }),
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      resetForPhotoChange: () =>
        set({
          designId: null,
          sessionToken: null,
          photos: [],
          currentStep: 'upload',
          iterationsUsed: 0,
          generatedImageUrl: null,
          // Conserver : selectedTemplate, partner1Name, partner2Name, weddingDate, weddingLocation
        }),
      reset: () => set({ ...initialState, _hasHydrated: true }),
    }),
    {
      name: 'siana-generation-store',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      // previewUrl (objectURL) et file (File non sérialisable) non persistés — comportement attendu
      partialize: (state) => ({
        designId: state.designId,
        sessionToken: state.sessionToken,
        photos: state.photos.map((p) => ({ ...p, previewUrl: '', file: null })),
        currentStep: state.currentStep,
        selectedTemplate: state.selectedTemplate,
        partner1Name: state.partner1Name,
        partner2Name: state.partner2Name,
        weddingDate: state.weddingDate,
        weddingLocation: state.weddingLocation,
        iterationsUsed: state.iterationsUsed,
        generatedImageUrl: state.generatedImageUrl,
      }),
    }
  )
)
