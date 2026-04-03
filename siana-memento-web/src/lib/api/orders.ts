const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

type CreateOrderResult =
  | { success: true; orderId: number; checkoutUrl: string }
  | { success: false; errorCode: string; message: string }

export async function createOrder(designId: number, sessionToken?: string | null): Promise<CreateOrderResult> {
  try {
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ designId, ...(sessionToken ? { sessionToken } : {}) }),
    })
    const json = await res.json()
    if (json.success) {
      return {
        success: true,
        orderId: json.data.orderId,
        checkoutUrl: json.data.checkoutUrl,
      }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'ORDER_FAILED',
      message: json.error?.message ?? 'Erreur lors de la création de la commande.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}

type GetOrderResult =
  | {
      success: true
      order: {
        id: number
        designId: number
        amount: number
        status: string
        paidAt: string | null
        createdAt: string
      }
    }
  | { success: false; errorCode: string; message: string }

export async function getOrder(orderId: number): Promise<GetOrderResult> {
  try {
    const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
      method: 'GET',
      credentials: 'include',
    })
    const json = await res.json()
    if (json.success) {
      return { success: true, order: json.data }
    }
    return {
      success: false,
      errorCode: json.error?.code ?? 'ORDER_NOT_FOUND',
      message: json.error?.message ?? 'Commande introuvable.',
    }
  } catch {
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Service indisponible. Vérifiez votre connexion et réessayez.',
    }
  }
}
