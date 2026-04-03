'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMe } from '@/lib/api/auth'
import { listOrders, type OrderData } from '@/lib/api/orders'
import { toast } from 'sonner'
import OrderCard from '@/components/siana/OrderCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

function SkeletonCards() {
  return (
    <ul className="space-y-4" aria-busy="true">
      {[1, 2].map((i) => (
        <li key={i}>
          <Card className="flex flex-col sm:flex-row overflow-hidden py-0 animate-pulse">
            <div className="w-full sm:w-36 shrink-0 aspect-[3/4] sm:aspect-auto sm:h-44 bg-muted" />
            <CardContent className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-14 rounded-full bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getMe().then((result) => {
      if (!result.success) {
        router.replace('/login?redirect=/orders')
        return
      }
      setAuthChecked(true)
    })
  }, [router])

  useEffect(() => {
    if (!authChecked) return
    listOrders().then((result) => {
      if (result.success) {
        setOrders(result.orders)
      } else {
        toast.error(result.message)
        setError(true)
      }
      setLoading(false)
    })
  }, [authChecked])

  if (!authChecked) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="mt-2 h-4 w-72 rounded bg-muted animate-pulse" />
        <div className="mt-8">
          <SkeletonCards />
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Mes commandes
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Retrouvez vos designs Save the Date achetés.
      </p>

      <div className="mt-8 space-y-4">
        {loading ? (
          <SkeletonCards />
        ) : error ? (
          <div className="flex flex-col items-center py-16 text-center">
            <img
              src="/mascotte/siana-error.svg"
              alt=""
              className="mb-6 h-28 w-28 opacity-80"
              aria-hidden="true"
            />
            <h2 className="font-display text-lg font-semibold">
              Impossible de charger vos commandes
            </h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Vérifiez votre connexion et réessayez dans quelques instants.
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <img
              src="/mascotte/siana-neutral.svg"
              alt=""
              className="mb-6 h-28 w-28 opacity-80"
              aria-hidden="true"
            />
            <h2 className="font-display text-lg font-semibold">
              Pas encore de commande
            </h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Créez votre premier Save the Date personnalisé — c'est rapide et unique !
            </p>
            <Button asChild className="mt-6" style={{ backgroundColor: '#2D4A3E' }}>
              <Link href="/generate/upload">Créer mon Save the Date</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
