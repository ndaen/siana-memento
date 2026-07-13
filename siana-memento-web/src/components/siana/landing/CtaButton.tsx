import * as React from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CtaButtonProps = {
  children: React.ReactNode
  /** Promesse de temps affichée en suffixe ("· 15 min"). Passer null pour la masquer. */
  timePromise?: string | null
  /** Rend l'élément enfant fourni (Link, button submit, lien externe…) au lieu d'un Link interne. */
  asChild?: boolean
  /** Convenance pour le cas courant : rend un <Link> interne. Ignoré si asChild. */
  href?: string
  className?: string
}

export default function CtaButton({
  children,
  timePromise = '15 min',
  asChild = false,
  href,
  className,
}: CtaButtonProps) {
  const classes = cn('h-11 rounded-full px-6 text-base', className)
  const promise = timePromise ? (
    <span className="font-normal opacity-70">{' · '}{timePromise}</span>
  ) : null

  // Mode asChild : l'appelant fournit l'élément ; on injecte la promesse dans ses enfants.
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<{
      children?: React.ReactNode
    }>
    const content = promise
      ? React.cloneElement(child, undefined, child.props.children, promise)
      : child
    return (
      <Button asChild className={classes}>
        {content}
      </Button>
    )
  }

  // Convenance : Link interne.
  if (href) {
    return (
      <Button asChild className={classes}>
        <Link href={href}>
          {children}
          {promise}
        </Link>
      </Button>
    )
  }

  // Repli : bouton simple (ex. onClick géré par un parent client).
  return (
    <Button className={classes}>
      {children}
      {promise}
    </Button>
  )
}
