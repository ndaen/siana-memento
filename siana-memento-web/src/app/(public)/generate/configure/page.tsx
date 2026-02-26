import type { Metadata } from 'next'
import ConfigureGuard from '@/components/siana/ConfigureGuard'
import ConfigForm from '@/components/siana/ConfigForm'

export const metadata: Metadata = {
  title: 'Votre mariage — Siana Memento',
}

export default function ConfigurePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-xl">
        <p className="sr-only">Étape 3 sur 4</p>
        <h1 className="mb-1 text-center text-3xl font-bold">Votre mariage</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Quelques informations pour personnaliser votre Save the Date
        </p>
        <ConfigureGuard>
          <ConfigForm />
        </ConfigureGuard>
      </div>
    </main>
  )
}
