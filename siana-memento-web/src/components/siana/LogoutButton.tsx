'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { logoutUser } from '@/lib/api/auth'
import { toast } from 'sonner'

interface LogoutButtonProps {
  className?: string
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    const result = await logoutUser()
    if (result.success) {
      router.push('/login')
    } else {
      toast.error('Impossible de se déconnecter. Veuillez réessayer.')
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Se déconnecter"
    >
      {isLoading ? 'Déconnexion…' : 'Se déconnecter'}
    </Button>
  )
}
