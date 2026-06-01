'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  MessageSquareQuote,
  Menu,
  type LucideIcon,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AdminSection {
  href: string
  label: string
  icon: LucideIcon
}

const adminSections: AdminSection[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/logs', label: 'Logs', icon: FileText },
  { href: '/admin/orders', label: 'Commandes', icon: ShoppingBag },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
]

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(href + '/')
}

/** Liste de liens partagée entre la sidebar desktop et le drawer mobile. */
function AdminNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Navigation admin" className="flex flex-col gap-1">
      {adminSections.map((section) => {
        const active = isActive(pathname, section.href)
        const Icon = section.icon
        return (
          <Link
            key={section.href}
            href={section.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active
                ? 'bg-primary font-semibold text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {section.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Sidebar persistante visible sur desktop (≥ md). */
export function AdminSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-border/60 px-3 py-6 md:block">
      <p className="px-3 pb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Administration
      </p>
      <AdminNavList />
    </aside>
  )
}

/** Barre mobile (< md) avec bouton hamburger ouvrant un drawer. */
export function AdminMobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Ouvrir la navigation admin">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader>
            <SheetTitle>Administration</SheetTitle>
          </SheetHeader>
          <div className="px-3 pb-6">
            <AdminNavList onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
      <span className="text-sm font-medium text-muted-foreground">Administration</span>
    </div>
  )
}
