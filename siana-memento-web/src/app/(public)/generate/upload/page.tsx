import UploadZone from '@/components/siana/UploadZone'

export const metadata = {
  title: 'Vos photos — Siana Memento',
}

export default function UploadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <p className="sr-only">Étape 1 sur 4</p>
        <h1 className="font-display mb-2 text-center text-3xl font-bold">Vos photos</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Uploadez 1 ou 2 photos qui serviront à créer votre illustration personnalisée.
        </p>
        <UploadZone />
      </div>
    </main>
  )
}
