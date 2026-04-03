'use client'

import { useEffect, useState } from 'react'
import { getMe, type User } from '@/lib/api/auth'
import LogoutButton from '@/components/siana/LogoutButton'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe().then((result) => {
      if (result.success) setUser(result.user)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="h-9 w-24 animate-pulse rounded-md bg-muted/40" aria-hidden="true" />
  if (!user) return null

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="hidden sm:inline">{user.email}</span>
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Mes commandes"
      >
        <ShoppingBag className="h-4 w-4" />
        <span className="hidden md:inline">Mes commandes</span>
      </Link>
      <LogoutButton />
    </div>
  )
}
