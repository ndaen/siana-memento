import UploadZone from '@/components/siana/UploadZone'
import { TEMPLATES } from '@/lib/templates'

export const metadata = {
  title: 'Vos photos — Siana Memento',
}

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>
}) {
  // `?style=` vient de la galerie landing ("Créer en Bohème") : présélectionne le
  // template pour tenir la promesse du CTA. Param non fiable → on ne garde que ce
  // qui matche un template connu, sinon `undefined` (l'étape template reste vierge).
  const { style } = await searchParams
  const initialStyle = TEMPLATES.find((t) => t.id === style)?.id

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <p className="sr-only">Étape 1 sur 4</p>
        <h1 className="font-display mb-2 text-center text-3xl font-bold">Vos photos</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Uploadez 1 ou 2 photos qui serviront à créer votre illustration personnalisée.
        </p>
        <UploadZone initialStyle={initialStyle} />
      </div>
    </main>
  )
}
