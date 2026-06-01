import { Clock } from 'lucide-react'

/**
 * État neutre « bientôt disponible » pour les sections admin dont la story
 * n'est pas encore implémentée (Logs → 6.4, Commandes → 6.6, Testimonials → 6.7).
 * La navigation fonctionne sans erreur jusqu'à leur livraison (AC#5).
 */
export default function AdminComingSoon({ title }: { title: string }) {
  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <div className="mt-16 flex flex-col items-center text-center">
        <Clock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-3 font-display text-lg font-semibold">Bientôt disponible</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Cette section est en cours de préparation et sera accessible prochainement.
        </p>
      </div>
    </>
  )
}
