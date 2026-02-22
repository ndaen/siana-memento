'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import AuthModal from '@/components/siana/AuthModal'
import { getMe, type User } from '@/lib/api/auth'

export default function AuthModalTrigger() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    getMe().then((result) => {
      setIsLoggedIn(result.success)
    })
  }, [])

  function handleAuthSuccess(_user: User) {
    setIsOpen(false)
    setIsLoggedIn(true)
    // Après connexion : rafraîchir pour que UserMenu reflète le nouvel état
    router.refresh()
  }

  // Ne pas afficher le bouton tant qu'on ne sait pas si l'utilisateur est connecté
  // ou si déjà connecté (le bouton d'achat sera géré dans Epic 3)
  if (isLoggedIn === null || isLoggedIn) return null

  return (
    <>
      <Button
        size="lg"
        className="font-semibold"
        onClick={() => setIsOpen(true)}
      >
        Acheter mon design — 19,90€
      </Button>
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        returnTo={typeof window !== 'undefined' ? window.location.pathname : '/'}
      />
    </>
  )
}
