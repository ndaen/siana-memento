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
  _hasHydrated: boolean
}

const initialState: GenerationState = {
  designId: null,
  sessionToken: null,
  photos: [],
  currentStep: 'upload',
  selectedTemplate: null,
  _hasHydrated: false,
}

interface GenerationStore extends GenerationState {
  setDesign: (id: number, token: string) => void
  setPhotos: (photos: UploadedPhoto[]) => void
  setStep: (step: GenerationStep) => void
  setTemplate: (template: string) => void
  setHasHydrated: (val: boolean) => void
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
      setHasHydrated: (val) => set({ _hasHydrated: val }),
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
      }),
    }
  )
)
