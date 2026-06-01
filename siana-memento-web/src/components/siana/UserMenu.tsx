'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { ShoppingBag, Settings, Sun, Moon, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logoutUser } from '@/lib/api/auth'
import { useGenerationStore } from '@/stores/useGenerationStore'
import { toast } from 'sonner'

export default function UserMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // L'espace admin a sa propre navigation (sidebar) ; on masque le raccourci
  // « Mes commandes » du header marketing quand on est sous /admin.
  // Frontière de segment pour ne pas matcher une future route type /admin-help.
  const isAdminArea = pathname === '/admin' || (pathname?.startsWith('/admin/') ?? false)

  async function handleLogout() {
    setIsLoggingOut(true)
    const result = await logoutUser()
    if (result.success) {
      useGenerationStore.getState().reset()
      router.push('/login')
    } else {
      toast.error('Impossible de se déconnecter. Veuillez réessayer.')
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!isAdminArea && (
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Mes commandes"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden md:inline">Mes commandes</span>
        </Link>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Paramètres">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
