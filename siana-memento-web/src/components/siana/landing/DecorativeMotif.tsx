import { cn } from '@/lib/utils'

type MotifVariant = 'branch' | 'leaf' | 'sprig'

type DecorativeMotifProps = {
  variant?: MotifVariant
  className?: string
}

/**
 * Motifs botaniques décoratifs (charte Siana). Purement décoratifs : aria-hidden,
 * couleur via currentColor — piloter avec ex. `text-primary/10`, positionner
 * en absolu depuis le parent. Taille par défaut h-40 w-20 (surchargée par className).
 */
export default function DecorativeMotif({
  variant = 'branch',
  className,
}: DecorativeMotifProps) {
  return (
    <svg
      viewBox="0 0 120 240"
      fill="none"
      aria-hidden="true"
      className={cn('h-40 w-20 pointer-events-none select-none', className)}
    >
      {motifs[variant]}
    </svg>
  )
}

const motifs: Record<MotifVariant, React.ReactNode> = {
  // Rameau courbe à feuilles alternées
  branch: (
    <>
      <path
        d="M62 232 C54 180 66 120 58 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M59 36 C42 24 28 26 18 40 C34 50 50 48 59 36Z" fill="currentColor" />
      <path d="M61 74 C78 62 92 64 102 78 C86 88 70 86 61 74Z" fill="currentColor" />
      <path d="M58 116 C41 104 27 106 17 120 C33 130 49 128 58 116Z" fill="currentColor" />
      <path d="M60 158 C77 146 91 148 101 162 C85 172 69 170 60 158Z" fill="currentColor" />
      <path d="M59 198 C44 188 32 190 24 202 C38 210 52 208 59 198Z" fill="currentColor" />
    </>
  ),
  // Feuille en deux lobes ; la nervure est un vide central (montre le fond du parent,
  // robuste sur n'importe quelle surface — pas de couleur de fond en dur).
  leaf: (
    <>
      <path d="M61.5 24 C103 72 105 150 61.5 216 L61.5 24 Z" fill="currentColor" />
      <path d="M58.5 24 C16 72 14 150 58.5 216 L58.5 24 Z" fill="currentColor" />
    </>
  ),
  // Brin fin à petites feuilles (façon eucalyptus)
  sprig: (
    <>
      <path
        d="M60 230 C58 170 62 90 60 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="42" cy="52" rx="13" ry="7" transform="rotate(-30 42 52)" fill="currentColor" />
      <ellipse cx="78" cy="76" rx="13" ry="7" transform="rotate(30 78 76)" fill="currentColor" />
      <ellipse cx="42" cy="104" rx="13" ry="7" transform="rotate(-30 42 104)" fill="currentColor" />
      <ellipse cx="78" cy="130" rx="13" ry="7" transform="rotate(30 78 130)" fill="currentColor" />
      <ellipse cx="43" cy="158" rx="12" ry="6.5" transform="rotate(-30 43 158)" fill="currentColor" />
      <ellipse cx="76" cy="184" rx="12" ry="6.5" transform="rotate(30 76 184)" fill="currentColor" />
      <ellipse cx="60" cy="24" rx="11" ry="6" transform="rotate(-90 60 24)" fill="currentColor" />
    </>
  ),
}
